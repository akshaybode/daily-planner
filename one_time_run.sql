-- ============================================================
-- PlanFlow Sample Data for akshaybode087@gmail.com
-- UUID: e9261d36-01cb-4d4a-b938-ef612b761305
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- PART 1: Profile update + Tasks Day -45 to Day -22
DO $$
DECLARE
  uid UUID := 'e9261d36-01cb-4d4a-b938-ef612b761305';
  cat_work UUID;
  cat_personal UUID;
  cat_health UUID;
  cat_learning UUID;
  cat_finance UUID;
  cat_errands UUID;
  d DATE;
BEGIN
  SELECT id INTO cat_work     FROM categories WHERE user_id = uid AND name = 'Work'     LIMIT 1;
  SELECT id INTO cat_personal FROM categories WHERE user_id = uid AND name = 'Personal' LIMIT 1;
  SELECT id INTO cat_health   FROM categories WHERE user_id = uid AND name = 'Health'   LIMIT 1;
  SELECT id INTO cat_learning FROM categories WHERE user_id = uid AND name = 'Learning' LIMIT 1;
  SELECT id INTO cat_finance  FROM categories WHERE user_id = uid AND name = 'Finance'  LIMIT 1;
  SELECT id INTO cat_errands  FROM categories WHERE user_id = uid AND name = 'Errands'  LIMIT 1;

  UPDATE profiles SET xp = 2350, level = 7, streak_freezes = 2 WHERE id = uid;

  FOR i IN 41..45 LOOP
    d := CURRENT_DATE - i;
    INSERT INTO tasks (user_id, title, date, priority, difficulty, category_id, is_completed, completed_at, estimated_minutes, actual_minutes, sort_order) VALUES
      (uid, 'Morning workout', d, 'high', 2, cat_health, true, d + TIME '07:30:00', 45, 50, 0),
      (uid, 'Review project requirements', d, 'high', 2, cat_work, true, d + TIME '10:00:00', 60, 55, 1),
      (uid, 'Read 20 pages', d, 'medium', 1, cat_learning, true, d + TIME '21:00:00', 30, 35, 2);
  END LOOP;

  FOR i IN 36..40 LOOP
    d := CURRENT_DATE - i;
    INSERT INTO tasks (user_id, title, date, priority, difficulty, category_id, is_completed, completed_at, estimated_minutes, actual_minutes, sort_order) VALUES
      (uid, 'Team standup meeting', d, 'medium', 1, cat_work, true, d + TIME '09:00:00', 15, 20, 0),
      (uid, 'Gym leg day', d, 'high', 3, cat_health, CASE WHEN i % 2 = 0 THEN true ELSE false END, CASE WHEN i % 2 = 0 THEN d + TIME '18:00:00' ELSE NULL END, 60, CASE WHEN i % 2 = 0 THEN 65 ELSE 0 END, 1),
      (uid, 'Budget review', d, 'medium', 1, cat_finance, true, d + TIME '20:00:00', 20, 15, 2);
  END LOOP;

  FOR i IN 29..35 LOOP
    d := CURRENT_DATE - i;
    INSERT INTO tasks (user_id, title, date, priority, difficulty, category_id, is_completed, completed_at, estimated_minutes, actual_minutes, sort_order) VALUES
      (uid, 'Deep work feature dev', d, 'high', 3, cat_work, true, d + TIME '09:30:00', 120, 110, 0),
      (uid, 'Code review for team PR', d, 'medium', 2, cat_work, true, d + TIME '14:00:00', 45, 40, 1),
      (uid, 'Evening run 5k', d, 'high', 2, cat_health, true, d + TIME '18:30:00', 30, 32, 2),
      (uid, 'Watch system design lecture', d, 'medium', 2, cat_learning, CASE WHEN i != 31 THEN true ELSE false END, CASE WHEN i != 31 THEN d + TIME '21:00:00' ELSE NULL END, 45, CASE WHEN i != 31 THEN 50 ELSE 0 END, 3),
      (uid, 'Meal prep for tomorrow', d, 'low', 1, cat_health, true, d + TIME '20:00:00', 25, 30, 4);
  END LOOP;

  FOR i IN 22..28 LOOP
    d := CURRENT_DATE - i;
    INSERT INTO tasks (user_id, title, date, priority, difficulty, category_id, is_completed, completed_at, estimated_minutes, actual_minutes, sort_order) VALUES
      (uid, 'Morning meditation', d, 'medium', 1, cat_health, true, d + TIME '06:30:00', 15, 15, 0),
      (uid, 'Sprint planning', d, 'high', 2, cat_work, true, d + TIME '09:00:00', 90, 85, 1),
      (uid, 'Lunch walk 30 min', d, 'low', 1, cat_health, true, d + TIME '12:30:00', 30, 30, 2),
      (uid, 'React Advanced course', d, 'high', 3, cat_learning, CASE WHEN i % 3 != 0 THEN true ELSE false END, CASE WHEN i % 3 != 0 THEN d + TIME '19:00:00' ELSE NULL END, 60, CASE WHEN i % 3 != 0 THEN 55 ELSE 0 END, 3),
      (uid, 'Journal and plan tomorrow', d, 'medium', 1, cat_personal, true, d + TIME '22:00:00', 15, 20, 4);
  END LOOP;

  RAISE NOTICE 'Part 1 done: profile + tasks day -45 to -22';
END $$;


-- PART 2: Tasks Day -21 to today
DO $$
DECLARE
  uid UUID := 'e9261d36-01cb-4d4a-b938-ef612b761305';
  cat_work UUID;
  cat_personal UUID;
  cat_health UUID;
  cat_learning UUID;
  cat_finance UUID;
  cat_errands UUID;
  d DATE;
BEGIN
  SELECT id INTO cat_work     FROM categories WHERE user_id = uid AND name = 'Work'     LIMIT 1;
  SELECT id INTO cat_personal FROM categories WHERE user_id = uid AND name = 'Personal' LIMIT 1;
  SELECT id INTO cat_health   FROM categories WHERE user_id = uid AND name = 'Health'   LIMIT 1;
  SELECT id INTO cat_learning FROM categories WHERE user_id = uid AND name = 'Learning' LIMIT 1;
  SELECT id INTO cat_finance  FROM categories WHERE user_id = uid AND name = 'Finance'  LIMIT 1;
  SELECT id INTO cat_errands  FROM categories WHERE user_id = uid AND name = 'Errands'  LIMIT 1;

  FOR i IN 15..21 LOOP
    d := CURRENT_DATE - i;
    INSERT INTO tasks (user_id, title, date, priority, difficulty, category_id, is_completed, completed_at, estimated_minutes, actual_minutes, sort_order) VALUES
      (uid, 'Gym upper body', d, 'high', 3, cat_health, true, d + TIME '07:00:00', 60, 65, 0),
      (uid, 'Client presentation prep', d, 'high', 3, cat_work, true, d + TIME '10:00:00', 90, 100, 1),
      (uid, 'Reply to emails', d, 'low', 1, cat_work, true, d + TIME '11:30:00', 20, 25, 2),
      (uid, 'Grocery shopping', d, 'medium', 1, cat_errands, CASE WHEN i % 2 = 0 THEN true ELSE false END, CASE WHEN i % 2 = 0 THEN d + TIME '17:00:00' ELSE NULL END, 40, CASE WHEN i % 2 = 0 THEN 45 ELSE 0 END, 3),
      (uid, 'Read Atomic Habits', d, 'medium', 1, cat_learning, true, d + TIME '21:30:00', 25, 30, 4);
  END LOOP;

  FOR i IN 8..14 LOOP
    d := CURRENT_DATE - i;
    INSERT INTO tasks (user_id, title, date, priority, difficulty, category_id, is_completed, completed_at, estimated_minutes, actual_minutes, sort_order) VALUES
      (uid, 'Morning run 3k', d, 'medium', 2, cat_health, true, d + TIME '06:45:00', 25, 22, 0),
      (uid, 'API integration dev', d, 'high', 3, cat_work, true, d + TIME '09:00:00', 120, 130, 1),
      (uid, 'Write unit tests', d, 'high', 2, cat_work, true, d + TIME '14:00:00', 60, 55, 2),
      (uid, 'LeetCode 2 problems', d, 'medium', 3, cat_learning, true, d + TIME '19:00:00', 45, 50, 3),
      (uid, 'Track weekly expenses', d, 'medium', 1, cat_finance, CASE WHEN i % 3 = 0 THEN true ELSE false END, CASE WHEN i % 3 = 0 THEN d + TIME '20:30:00' ELSE NULL END, 15, CASE WHEN i % 3 = 0 THEN 20 ELSE 0 END, 4),
      (uid, 'Stretching and yoga', d, 'low', 1, cat_health, true, d + TIME '21:00:00', 20, 20, 5);
  END LOOP;

  FOR i IN 1..7 LOOP
    d := CURRENT_DATE - i;
    INSERT INTO tasks (user_id, title, date, priority, difficulty, category_id, is_completed, completed_at, estimated_minutes, actual_minutes, sort_order) VALUES
      (uid, 'Morning workout and stretch', d, 'high', 2, cat_health, true, d + TIME '07:00:00', 50, 55, 0),
      (uid, 'Feature development sprint', d, 'high', 3, cat_work, true, d + TIME '09:30:00', 120, 115, 1),
      (uid, 'Code review and mentoring', d, 'medium', 2, cat_work, true, d + TIME '14:00:00', 45, 40, 2),
      (uid, 'System Design chapter', d, 'high', 2, cat_learning, true, d + TIME '18:00:00', 45, 50, 3),
      (uid, 'Meal prep healthy dinner', d, 'medium', 1, cat_health, true, d + TIME '19:30:00', 30, 35, 4),
      (uid, 'Evening journal reflection', d, 'low', 1, cat_personal, true, d + TIME '22:00:00', 15, 15, 5);
  END LOOP;

  d := CURRENT_DATE;
  INSERT INTO tasks (user_id, title, date, priority, difficulty, category_id, is_completed, completed_at, estimated_minutes, actual_minutes, sort_order) VALUES
    (uid, 'Morning meditation 15 min', d, 'medium', 1, cat_health, true, d + TIME '06:30:00', 15, 15, 0),
    (uid, 'Deploy to production', d, 'high', 3, cat_work, true, d + TIME '10:00:00', 120, 100, 1),
    (uid, 'Team sync meeting', d, 'medium', 1, cat_work, true, d + TIME '11:30:00', 30, 35, 2),
    (uid, 'Gym full body workout', d, 'high', 3, cat_health, false, NULL, 60, 0, 3),
    (uid, 'Read 30 pages Deep Work', d, 'medium', 2, cat_learning, false, NULL, 30, 0, 4),
    (uid, 'Review monthly budget', d, 'medium', 1, cat_finance, false, NULL, 20, 0, 5),
    (uid, 'Prepare weekly groceries list', d, 'low', 1, cat_errands, false, NULL, 15, 0, 6);

  RAISE NOTICE 'Part 2 done: tasks day -21 to today';
END $$;


-- PART 3: Sub-tasks, links, achievements
DO $$
DECLARE
  uid UUID := 'e9261d36-01cb-4d4a-b938-ef612b761305';
  tid UUID;
BEGIN
  SELECT id INTO tid FROM tasks WHERE user_id = uid AND title = 'Deploy to production' AND date = CURRENT_DATE LIMIT 1;
  IF tid IS NOT NULL THEN
    INSERT INTO sub_tasks (task_id, title, is_completed, sort_order) VALUES
      (tid, 'Run final test suite', true, 0),
      (tid, 'Merge PR to main', true, 1),
      (tid, 'Deploy to staging', true, 2),
      (tid, 'Verify staging', true, 3),
      (tid, 'Deploy to prod', true, 4);
  END IF;

  SELECT id INTO tid FROM tasks WHERE user_id = uid AND title = 'Gym full body workout' AND date = CURRENT_DATE LIMIT 1;
  IF tid IS NOT NULL THEN
    INSERT INTO sub_tasks (task_id, title, is_completed, sort_order) VALUES
      (tid, 'Warm-up 10 min', false, 0),
      (tid, 'Squats 4x12', false, 1),
      (tid, 'Bench press 4x10', false, 2),
      (tid, 'Pull-ups 3x8', false, 3),
      (tid, 'Cool-down stretches', false, 4);
  END IF;

  SELECT id INTO tid FROM tasks WHERE user_id = uid AND title = 'System Design chapter' AND date = CURRENT_DATE - 1 LIMIT 1;
  IF tid IS NOT NULL THEN
    INSERT INTO task_links (task_id, url, title, link_type, sort_order) VALUES
      (tid, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'System Design Lecture', 'youtube', 0),
      (tid, 'https://notion.so/my-notes', 'My Study Notes', 'notion', 1);
  END IF;

  SELECT id INTO tid FROM tasks WHERE user_id = uid AND title = 'Read 30 pages Deep Work' AND date = CURRENT_DATE LIMIT 1;
  IF tid IS NOT NULL THEN
    INSERT INTO task_links (task_id, url, title, link_type, sort_order) VALUES
      (tid, 'https://www.amazon.com/Deep-Work-Cal-Newport/dp/1455586692', 'Book on Amazon', 'generic', 0);
  END IF;

  INSERT INTO achievements (user_id, achievement_key, unlocked_at) VALUES
    (uid, 'first_task',    NOW() - INTERVAL '44 days'),
    (uid, 'tasks_10',      NOW() - INTERVAL '38 days'),
    (uid, 'tasks_25',      NOW() - INTERVAL '30 days'),
    (uid, 'tasks_50',      NOW() - INTERVAL '20 days'),
    (uid, 'tasks_100',     NOW() - INTERVAL '8 days'),
    (uid, 'streak_3',      NOW() - INTERVAL '42 days'),
    (uid, 'streak_7',      NOW() - INTERVAL '35 days'),
    (uid, 'streak_14',     NOW() - INTERVAL '28 days'),
    (uid, 'streak_30',     NOW() - INTERVAL '12 days'),
    (uid, 'perfect_5',     NOW() - INTERVAL '25 days'),
    (uid, 'morning_bird',  NOW() - INTERVAL '40 days'),
    (uid, 'xp_500',        NOW() - INTERVAL '30 days'),
    (uid, 'xp_2000',       NOW() - INTERVAL '10 days'),
    (uid, 'level_5',       NOW() - INTERVAL '15 days'),
    (uid, 'pomodoro_1',    NOW() - INTERVAL '35 days'),
    (uid, 'pomodoro_10',   NOW() - INTERVAL '18 days'),
    (uid, 'hard_tasks_10', NOW() - INTERVAL '14 days')
  ON CONFLICT (user_id, achievement_key) DO NOTHING;

  RAISE NOTICE 'Part 3 done: sub-tasks, links, achievements';
END $$;


-- PART 4: Pomodoro sessions + custom template
DO $$
DECLARE
  uid UUID := 'e9261d36-01cb-4d4a-b938-ef612b761305';
  d DATE;
  dur INT;
BEGIN
  FOR i IN 1..25 LOOP
    d := CURRENT_DATE - (i * 2 % 40);
    dur := CASE WHEN i % 3 = 0 THEN 50 ELSE 25 END;
    INSERT INTO pomodoro_sessions (user_id, task_id, duration_minutes, completed, started_at, ended_at) VALUES
      (uid, NULL, dur, true,
       (d + TIME '09:00:00' + (i * INTERVAL '30 minutes'))::timestamptz,
       (d + TIME '09:00:00' + (i * INTERVAL '30 minutes') + (dur * INTERVAL '1 minute'))::timestamptz);
  END LOOP;

  INSERT INTO task_templates (user_id, name, description, is_system, template_tasks) VALUES
    (uid, 'My Daily Routine', 'My personal daily productivity routine', false,
     '[{"title":"Morning meditation","priority":"medium","difficulty":1,"categoryHint":"Health","estimatedMinutes":15},{"title":"Deep work block","priority":"high","difficulty":3,"categoryHint":"Work","estimatedMinutes":120},{"title":"Exercise","priority":"high","difficulty":2,"categoryHint":"Health","estimatedMinutes":45},{"title":"Study session","priority":"medium","difficulty":2,"categoryHint":"Learning","estimatedMinutes":45},{"title":"Evening reflection","priority":"low","difficulty":1,"categoryHint":"Personal","estimatedMinutes":15}]')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Part 4 done: pomodoro sessions + template';
END $$;

SELECT 'All sample data inserted successfully!' AS status;
