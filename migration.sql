-- ============================================================
-- PlanFlow Migration: Add gamification, pomodoro, templates
-- Run this in Supabase SQL Editor if you already ran the old schema
-- ============================================================

-- 1. Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_freezes INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_freeze_used_at DATE;

-- 2. Add new columns to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 30;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS actual_minutes INTEGER DEFAULT 0;

-- 3. Create new tables
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  template_tasks JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_user ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON public.task_templates(user_id);

-- 5. Enable RLS on new tables
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for new tables (drop first if they exist)
DROP POLICY IF EXISTS "Users manage own achievements" ON public.achievements;
CREATE POLICY "Users manage own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public achievements readable" ON public.achievements;
CREATE POLICY "Public achievements readable" ON public.achievements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_profile_public = true)
);

DROP POLICY IF EXISTS "Users manage own pomodoro sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users manage own pomodoro sessions" ON public.pomodoro_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own templates" ON public.task_templates;
CREATE POLICY "Users manage own templates" ON public.task_templates FOR ALL USING (auth.uid() = user_id OR is_system = true);

DROP POLICY IF EXISTS "System templates readable by all" ON public.task_templates;
CREATE POLICY "System templates readable by all" ON public.task_templates FOR SELECT USING (is_system = true);

-- 7. Seed system templates
INSERT INTO public.task_templates (name, description, is_system, template_tasks) VALUES
  ('Morning Routine', 'Start your day right with a productive morning', true,
   '[{"title":"Morning meditation","priority":"medium","difficulty":1,"categoryHint":"Health","estimatedMinutes":15},{"title":"Exercise / Workout","priority":"high","difficulty":2,"categoryHint":"Health","estimatedMinutes":45},{"title":"Healthy breakfast","priority":"medium","difficulty":1,"categoryHint":"Health","estimatedMinutes":20},{"title":"Review today''s goals","priority":"high","difficulty":1,"categoryHint":"Work","estimatedMinutes":10}]'),
  ('Fitness Routine', 'Stay consistent with your fitness goals', true,
   '[{"title":"Warm-up stretches","priority":"medium","difficulty":1,"categoryHint":"Health","estimatedMinutes":10},{"title":"Main workout","priority":"high","difficulty":3,"categoryHint":"Health","estimatedMinutes":45},{"title":"Cool-down","priority":"low","difficulty":1,"categoryHint":"Health","estimatedMinutes":10},{"title":"Log workout & nutrition","priority":"medium","difficulty":1,"categoryHint":"Health","estimatedMinutes":5}]'),
  ('Deep Work Sprint', 'Focused work block for maximum productivity', true,
   '[{"title":"Define sprint goal","priority":"high","difficulty":1,"categoryHint":"Work","estimatedMinutes":5},{"title":"Deep work session 1 (90 min)","priority":"high","difficulty":3,"categoryHint":"Work","estimatedMinutes":90},{"title":"Short break","priority":"low","difficulty":1,"categoryHint":"Personal","estimatedMinutes":15},{"title":"Deep work session 2 (60 min)","priority":"high","difficulty":3,"categoryHint":"Work","estimatedMinutes":60},{"title":"Review & document progress","priority":"medium","difficulty":1,"categoryHint":"Work","estimatedMinutes":15}]'),
  ('Learning Session', 'Structured learning and skill-building', true,
   '[{"title":"Read / Watch lecture","priority":"high","difficulty":2,"categoryHint":"Learning","estimatedMinutes":45},{"title":"Take notes & summarize","priority":"high","difficulty":2,"categoryHint":"Learning","estimatedMinutes":20},{"title":"Practice exercises","priority":"medium","difficulty":3,"categoryHint":"Learning","estimatedMinutes":30},{"title":"Review flashcards","priority":"low","difficulty":1,"categoryHint":"Learning","estimatedMinutes":15}]'),
  ('Weekly Planning', 'Plan your week for success', true,
   '[{"title":"Review last week''s progress","priority":"high","difficulty":1,"categoryHint":"Personal","estimatedMinutes":15},{"title":"Set weekly goals","priority":"high","difficulty":2,"categoryHint":"Work","estimatedMinutes":20},{"title":"Schedule important tasks","priority":"high","difficulty":2,"categoryHint":"Work","estimatedMinutes":15},{"title":"Meal prep planning","priority":"medium","difficulty":1,"categoryHint":"Health","estimatedMinutes":10},{"title":"Review finances & budget","priority":"medium","difficulty":1,"categoryHint":"Finance","estimatedMinutes":15}]'),
  ('Evening Wind-Down', 'End the day with reflection and rest', true,
   '[{"title":"Journal / Reflect on the day","priority":"medium","difficulty":1,"categoryHint":"Personal","estimatedMinutes":15},{"title":"Prepare tomorrow''s tasks","priority":"high","difficulty":1,"categoryHint":"Work","estimatedMinutes":10},{"title":"Light reading","priority":"low","difficulty":1,"categoryHint":"Learning","estimatedMinutes":20},{"title":"Screen-off & relax","priority":"medium","difficulty":1,"categoryHint":"Health","estimatedMinutes":30}]')
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Migration complete!' AS status;
