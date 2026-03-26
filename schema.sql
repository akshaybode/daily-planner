-- ============================================================
-- PlanFlow Database Schema for Supabase
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT DEFAULT '',
  public_slug TEXT UNIQUE NOT NULL,
  is_profile_public BOOLEAN DEFAULT true,
  avatar_url TEXT DEFAULT '',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_freezes INTEGER DEFAULT 0,
  streak_freeze_used_at DATE,
  settings JSONB DEFAULT '{"theme":"system","weekStartsOn":1,"reportDay":"sunday"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  estimated_minutes INTEGER DEFAULT 30,
  actual_minutes INTEGER DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_days TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Task links
CREATE TABLE IF NOT EXISTS public.task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'generic',
  sort_order INTEGER DEFAULT 0
);

-- 5. Sub-tasks
CREATE TABLE IF NOT EXISTS public.sub_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- 6. Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- 7. Pomodoro sessions
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 8. Task templates
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  template_tasks JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_task_links_task ON public.task_links(task_id);
CREATE INDEX IF NOT EXISTS idx_sub_tasks_task ON public.sub_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(public_slug);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_user ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON public.task_templates(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles viewable by anyone" ON public.profiles FOR SELECT USING (is_profile_public = true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories
CREATE POLICY "Users manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public profile tasks are readable" ON public.tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_profile_public = true)
);

-- Task links
CREATE POLICY "Users manage own task links" ON public.task_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
);
CREATE POLICY "Public task links readable" ON public.task_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tasks t JOIN public.profiles p ON p.id = t.user_id WHERE t.id = task_id AND p.is_profile_public = true)
);

-- Sub-tasks
CREATE POLICY "Users manage own sub tasks" ON public.sub_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
);
CREATE POLICY "Public sub tasks readable" ON public.sub_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tasks t JOIN public.profiles p ON p.id = t.user_id WHERE t.id = task_id AND p.is_profile_public = true)
);

-- Achievements
CREATE POLICY "Users manage own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public achievements readable" ON public.achievements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_profile_public = true)
);

-- Pomodoro sessions
CREATE POLICY "Users manage own pomodoro sessions" ON public.pomodoro_sessions FOR ALL USING (auth.uid() = user_id);

-- Task templates
CREATE POLICY "Users manage own templates" ON public.task_templates FOR ALL USING (auth.uid() = user_id OR is_system = true);
CREATE POLICY "System templates readable by all" ON public.task_templates FOR SELECT USING (is_system = true);

-- ============================================================
-- Auto-create profile on signup + seed default categories + system templates
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, public_slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    LOWER(REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      '[^a-zA-Z0-9]', '-', 'g'
    )) || '-' || SUBSTR(NEW.id::text, 1, 4)
  );

  INSERT INTO public.categories (user_id, name, color, icon) VALUES
    (NEW.id, 'Work',     '#6366f1', 'Briefcase'),
    (NEW.id, 'Personal', '#8b5cf6', 'User'),
    (NEW.id, 'Health',   '#10b981', 'Heart'),
    (NEW.id, 'Learning', '#f59e0b', 'BookOpen'),
    (NEW.id, 'Finance',  '#06b6d4', 'DollarSign'),
    (NEW.id, 'Errands',  '#f43f5e', 'ShoppingBag');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Seed system templates
-- ============================================================
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

-- ============================================================
-- Helper: Get daily stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_daily_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(date DATE, total_tasks BIGINT, completed_tasks BIGINT) AS $$
  SELECT t.date, COUNT(*)::BIGINT AS total_tasks,
    COUNT(*) FILTER (WHERE t.is_completed)::BIGINT AS completed_tasks
  FROM public.tasks t
  WHERE t.user_id = p_user_id AND t.date >= p_start_date AND t.date <= p_end_date
  GROUP BY t.date ORDER BY t.date;
$$ LANGUAGE sql SECURITY DEFINER;
