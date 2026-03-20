-- ============================================================
-- PlanFlow Database Schema for Supabase
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT DEFAULT '',
  public_slug TEXT UNIQUE NOT NULL,
  is_profile_public BOOLEAN DEFAULT true,
  avatar_url TEXT DEFAULT '',
  settings JSONB DEFAULT '{"theme":"system","weekStartsOn":1,"reportDay":"sunday"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_days TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Task links
CREATE TABLE public.task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'generic',
  sort_order INTEGER DEFAULT 0
);

-- 5. Sub-tasks
CREATE TABLE public.sub_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_tasks_user_date ON public.tasks(user_id, date);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_categories_user ON public.categories(user_id);
CREATE INDEX idx_task_links_task ON public.task_links(task_id);
CREATE INDEX idx_sub_tasks_task ON public.sub_tasks(task_id);
CREATE INDEX idx_profiles_slug ON public.profiles(public_slug);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles viewable by anyone"
  ON public.profiles FOR SELECT USING (is_profile_public = true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories
CREATE POLICY "Users manage own categories"
  ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Tasks: owner full access
CREATE POLICY "Users manage own tasks"
  ON public.tasks FOR ALL USING (auth.uid() = user_id);
-- Tasks: public read for public profiles
CREATE POLICY "Public profile tasks are readable"
  ON public.tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_profile_public = true)
  );

-- Task links
CREATE POLICY "Users manage own task links"
  ON public.task_links FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
  );
CREATE POLICY "Public task links readable"
  ON public.task_links FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.profiles p ON p.id = t.user_id
      WHERE t.id = task_id AND p.is_profile_public = true
    )
  );

-- Sub-tasks
CREATE POLICY "Users manage own sub tasks"
  ON public.sub_tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
  );
CREATE POLICY "Public sub tasks readable"
  ON public.sub_tasks FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.profiles p ON p.id = t.user_id
      WHERE t.id = task_id AND p.is_profile_public = true
    )
  );

-- ============================================================
-- Auto-create profile on signup + seed default categories
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
-- Helper: Get daily stats (used by heatmap, reports)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_daily_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(date DATE, total_tasks BIGINT, completed_tasks BIGINT) AS $$
  SELECT
    t.date,
    COUNT(*)::BIGINT AS total_tasks,
    COUNT(*) FILTER (WHERE t.is_completed)::BIGINT AS completed_tasks
  FROM public.tasks t
  WHERE t.user_id = p_user_id
    AND t.date >= p_start_date
    AND t.date <= p_end_date
  GROUP BY t.date
  ORDER BY t.date;
$$ LANGUAGE sql SECURITY DEFINER;
