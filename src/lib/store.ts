import { supabase } from "./supabase";
import {
  Task, Category, User, DayStats, WeeklyReport, HeatmapDay,
  PublicProfileData, Achievement, PomodoroSession, TaskTemplate, RadarData,
} from "./types";
import { formatDate, getWeekDates, getHeatmapLevel } from "./utils";

// ─── XP Constants ───

const XP_PER_DIFFICULTY: Record<number, number> = { 1: 10, 2: 25, 3: 50 };
const XP_STREAK_BONUS = 5;
const XP_PERFECT_DAY_BONUS = 30;
const XP_POMODORO_COMPLETE = 15;

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  let required = 100;
  while (xp >= required) {
    level++;
    required = Math.floor(100 * Math.pow(1.5, level - 1));
  }
  return level;
}

// ─── Row ↔ Model mappers ───

function rowToTask(row: any): Task {
  return {
    id: row.id, userId: row.user_id, title: row.title,
    description: row.description ?? "", date: row.date, priority: row.priority,
    difficulty: row.difficulty ?? 1, categoryId: row.category_id ?? "",
    isCompleted: row.is_completed, completedAt: row.completed_at,
    estimatedMinutes: row.estimated_minutes ?? 30,
    actualMinutes: row.actual_minutes ?? 0,
    links: (row.task_links ?? []).map((l: any) => ({
      id: l.id, url: l.url, title: l.title, linkType: l.link_type,
    })),
    subTasks: (row.sub_tasks ?? []).map((s: any) => ({
      id: s.id, title: s.title, isCompleted: s.is_completed,
    })),
    isRecurring: row.is_recurring, recurrenceDays: row.recurrence_days ?? [],
    sortOrder: row.sort_order, createdAt: row.created_at,
  };
}

function rowToCategory(row: any): Category {
  return { id: row.id, userId: row.user_id, name: row.name, color: row.color, icon: row.icon };
}

function rowToUser(row: any): User {
  const s = row.settings ?? {};
  return {
    id: row.id, email: row.email, name: row.name,
    avatarUrl: row.avatar_url ?? "",
    publicSlug: row.public_slug,
    isProfilePublic: row.is_profile_public ?? true,
    bio: row.bio ?? "",
    xp: row.xp ?? 0,
    level: row.level ?? 1,
    streakFreezes: row.streak_freezes ?? 0,
    streakFreezeUsedAt: row.streak_freeze_used_at,
    createdAt: row.created_at,
    settings: {
      theme: s.theme ?? "system",
      weekStartsOn: s.weekStartsOn ?? 1,
      reportDay: s.reportDay ?? "sunday",
    },
  };
}

// ─── Profile ───

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) return null;
  return rowToUser(data);
}

export async function updateProfile(user: User): Promise<void> {
  await supabase.from("profiles").update({
    name: user.name, bio: user.bio,
    is_profile_public: user.isProfilePublic,
    avatar_url: user.avatarUrl, settings: user.settings,
  }).eq("id", user.id);
}

export async function addXp(userId: string, amount: number): Promise<{ newXp: number; newLevel: number }> {
  const profile = await getProfile(userId);
  if (!profile) return { newXp: 0, newLevel: 1 };
  const newXp = profile.xp + amount;
  const newLevel = getLevelFromXp(newXp);
  await supabase.from("profiles").update({ xp: newXp, level: newLevel }).eq("id", userId);
  return { newXp, newLevel };
}

// ─── Streak Freeze ───

export async function earnStreakFreeze(userId: string): Promise<void> {
  const profile = await getProfile(userId);
  if (profile) {
    await supabase.from("profiles").update({ streak_freezes: profile.streakFreezes + 1 }).eq("id", userId);
  }
}

export async function useStreakFreeze(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  if (!profile || profile.streakFreezes <= 0) return false;
  await supabase.from("profiles").update({
    streak_freezes: profile.streakFreezes - 1,
    streak_freeze_used_at: formatDate(new Date()),
  }).eq("id", userId);
  return true;
}

// ─── Categories ───

export async function getCategories(userId: string): Promise<Category[]> {
  const { data } = await supabase.from("categories").select("*").eq("user_id", userId).order("created_at");
  return (data ?? []).map(rowToCategory);
}

export async function addCategory(cat: Category): Promise<void> {
  await supabase.from("categories").insert({
    id: cat.id, user_id: cat.userId, name: cat.name, color: cat.color, icon: cat.icon,
  });
}

// ─── Tasks ───

export async function getTasks(userId: string): Promise<Task[]> {
  const { data } = await supabase.from("tasks").select("*, task_links(*), sub_tasks(*)").eq("user_id", userId).order("sort_order");
  return (data ?? []).map(rowToTask);
}

export async function getTasksByDate(userId: string, date: string): Promise<Task[]> {
  const { data } = await supabase.from("tasks").select("*, task_links(*), sub_tasks(*)").eq("user_id", userId).eq("date", date).order("sort_order");
  return (data ?? []).map(rowToTask);
}

export async function getTasksForDateRange(userId: string, startDate: string, endDate: string): Promise<Task[]> {
  const { data } = await supabase.from("tasks").select("*, task_links(*), sub_tasks(*)").eq("user_id", userId).gte("date", startDate).lte("date", endDate).order("sort_order");
  return (data ?? []).map(rowToTask);
}

export async function addTask(task: Task): Promise<void> {
  const { data: inserted } = await supabase.from("tasks").insert({
    user_id: task.userId, title: task.title, description: task.description,
    date: task.date, priority: task.priority, difficulty: task.difficulty,
    category_id: task.categoryId || null, is_completed: false,
    estimated_minutes: task.estimatedMinutes,
    is_recurring: task.isRecurring, recurrence_days: task.recurrenceDays,
    sort_order: task.sortOrder,
  }).select("id").single();

  if (!inserted) return;
  const taskId = inserted.id;

  if (task.links.length > 0) {
    await supabase.from("task_links").insert(
      task.links.map((l, i) => ({ task_id: taskId, url: l.url, title: l.title, link_type: l.linkType, sort_order: i }))
    );
  }
  if (task.subTasks.length > 0) {
    await supabase.from("sub_tasks").insert(
      task.subTasks.map((s, i) => ({ task_id: taskId, title: s.title, is_completed: false, sort_order: i }))
    );
  }
}

export async function updateTask(task: Task): Promise<void> {
  await supabase.from("tasks").update({
    title: task.title, description: task.description, date: task.date,
    priority: task.priority, difficulty: task.difficulty,
    category_id: task.categoryId || null,
    is_completed: task.isCompleted, completed_at: task.completedAt,
    estimated_minutes: task.estimatedMinutes, actual_minutes: task.actualMinutes,
    is_recurring: task.isRecurring, recurrence_days: task.recurrenceDays,
    sort_order: task.sortOrder,
  }).eq("id", task.id);

  await supabase.from("task_links").delete().eq("task_id", task.id);
  if (task.links.length > 0) {
    await supabase.from("task_links").insert(
      task.links.map((l, i) => ({ task_id: task.id, url: l.url, title: l.title, link_type: l.linkType, sort_order: i }))
    );
  }

  await supabase.from("sub_tasks").delete().eq("task_id", task.id);
  if (task.subTasks.length > 0) {
    await supabase.from("sub_tasks").insert(
      task.subTasks.map((s, i) => ({ task_id: task.id, title: s.title, is_completed: s.isCompleted, sort_order: i }))
    );
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  await supabase.from("tasks").delete().eq("id", taskId);
}

export async function toggleTaskComplete(taskId: string, userId: string): Promise<Task | null> {
  const { data: current } = await supabase.from("tasks").select("is_completed, difficulty").eq("id", taskId).single();
  if (!current) return null;

  const newVal = !current.is_completed;
  await supabase.from("tasks").update({
    is_completed: newVal,
    completed_at: newVal ? new Date().toISOString() : null,
  }).eq("id", taskId);

  if (newVal) {
    const xpAmount = XP_PER_DIFFICULTY[current.difficulty] || 10;
    await addXp(userId, xpAmount);
  }

  const { data: updated } = await supabase.from("tasks").select("*, task_links(*), sub_tasks(*)").eq("id", taskId).single();
  return updated ? rowToTask(updated) : null;
}

export async function updateSubTask(taskId: string, subTaskId: string, isCompleted: boolean): Promise<void> {
  await supabase.from("sub_tasks").update({ is_completed: isCompleted }).eq("id", subTaskId);
}

// ─── Achievements ───

const ACHIEVEMENT_DEFS: Achievement[] = [
  { key: "first_task", title: "First Step", description: "Complete your first task", icon: "zap", type: "milestone" },
  { key: "tasks_10", title: "Getting Started", description: "Complete 10 tasks", icon: "star", type: "milestone" },
  { key: "tasks_25", title: "Solid Progress", description: "Complete 25 tasks", icon: "star", type: "milestone" },
  { key: "tasks_50", title: "Half Century", description: "Complete 50 tasks", icon: "trophy", type: "milestone" },
  { key: "tasks_100", title: "Century Club", description: "Complete 100 tasks", icon: "trophy", type: "milestone" },
  { key: "tasks_500", title: "Task Master", description: "Complete 500 tasks", icon: "crown", type: "milestone" },
  { key: "streak_3", title: "Streak Builder", description: "3-day streak", icon: "flame", type: "streak" },
  { key: "streak_7", title: "Week Warrior", description: "7-day streak", icon: "flame", type: "streak" },
  { key: "streak_14", title: "On Fire", description: "14-day streak", icon: "flame", type: "streak" },
  { key: "streak_30", title: "Unstoppable", description: "30-day streak", icon: "flame", type: "streak" },
  { key: "streak_100", title: "Legendary", description: "100-day streak", icon: "flame", type: "streak" },
  { key: "perfect_5", title: "Perfectionist", description: "5 perfect days", icon: "crown", type: "consistency" },
  { key: "perfect_20", title: "Flawless", description: "20 perfect days", icon: "crown", type: "consistency" },
  { key: "morning_bird", title: "Early Bird", description: "Complete a task before 8 AM", icon: "sun", type: "consistency" },
  { key: "xp_500", title: "XP Hunter", description: "Earn 500 XP", icon: "zap", type: "xp" },
  { key: "xp_2000", title: "XP Warrior", description: "Earn 2000 XP", icon: "zap", type: "xp" },
  { key: "xp_5000", title: "XP Legend", description: "Earn 5000 XP", icon: "zap", type: "xp" },
  { key: "level_5", title: "Leveling Up", description: "Reach level 5", icon: "award", type: "xp" },
  { key: "level_10", title: "Double Digits", description: "Reach level 10", icon: "award", type: "xp" },
  { key: "pomodoro_1", title: "Focus Starter", description: "Complete your first Pomodoro", icon: "timer", type: "pomodoro" },
  { key: "pomodoro_10", title: "Focus Master", description: "Complete 10 Pomodoro sessions", icon: "timer", type: "pomodoro" },
  { key: "pomodoro_50", title: "Deep Worker", description: "Complete 50 Pomodoro sessions", icon: "timer", type: "pomodoro" },
  { key: "hard_tasks_10", title: "Challenge Seeker", description: "Complete 10 hard tasks", icon: "target", type: "milestone" },
  { key: "hard_tasks_50", title: "Beast Mode", description: "Complete 50 hard tasks", icon: "target", type: "milestone" },
];

export function getAllAchievementDefs(): Achievement[] {
  return ACHIEVEMENT_DEFS;
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const { data } = await supabase.from("achievements").select("*").eq("user_id", userId);
  const unlockedKeys = new Set((data ?? []).map((r: any) => r.achievement_key));
  const unlockedMap = new Map((data ?? []).map((r: any) => [r.achievement_key, r.unlocked_at]));
  return ACHIEVEMENT_DEFS.filter((a) => unlockedKeys.has(a.key))
    .map((a) => ({ ...a, unlockedAt: unlockedMap.get(a.key) }));
}

export async function checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
  const [profile, allTasks, pomodoroCount] = await Promise.all([
    getProfile(userId),
    getTasks(userId),
    getPomodoroCount(userId),
  ]);
  if (!profile) return [];

  const { data: existing } = await supabase.from("achievements").select("achievement_key").eq("user_id", userId);
  const unlocked = new Set((existing ?? []).map((r: any) => r.achievement_key));

  const completed = allTasks.filter((t) => t.isCompleted);
  const hardCompleted = completed.filter((t) => t.difficulty === 3);
  const streak = await getStreak(userId);

  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const statsMap = await getDailyStatsRange(userId, formatDate(yearStart), formatDate(today));
  let perfectDays = 0;
  statsMap.forEach((s) => { if (s.totalTasks > 0 && s.completionRate === 1) perfectDays++; });

  const checks: [string, boolean][] = [
    ["first_task", completed.length >= 1],
    ["tasks_10", completed.length >= 10],
    ["tasks_25", completed.length >= 25],
    ["tasks_50", completed.length >= 50],
    ["tasks_100", completed.length >= 100],
    ["tasks_500", completed.length >= 500],
    ["streak_3", streak >= 3],
    ["streak_7", streak >= 7],
    ["streak_14", streak >= 14],
    ["streak_30", streak >= 30],
    ["streak_100", streak >= 100],
    ["perfect_5", perfectDays >= 5],
    ["perfect_20", perfectDays >= 20],
    ["xp_500", profile.xp >= 500],
    ["xp_2000", profile.xp >= 2000],
    ["xp_5000", profile.xp >= 5000],
    ["level_5", profile.level >= 5],
    ["level_10", profile.level >= 10],
    ["pomodoro_1", pomodoroCount >= 1],
    ["pomodoro_10", pomodoroCount >= 10],
    ["pomodoro_50", pomodoroCount >= 50],
    ["hard_tasks_10", hardCompleted.length >= 10],
    ["hard_tasks_50", hardCompleted.length >= 50],
  ];

  const newlyUnlocked: Achievement[] = [];
  const toInsert: { user_id: string; achievement_key: string }[] = [];

  for (const [key, condition] of checks) {
    if (condition && !unlocked.has(key)) {
      toInsert.push({ user_id: userId, achievement_key: key });
      const def = ACHIEVEMENT_DEFS.find((a) => a.key === key);
      if (def) newlyUnlocked.push(def);
    }
  }

  if (toInsert.length > 0) {
    await supabase.from("achievements").insert(toInsert);
  }

  return newlyUnlocked;
}

// ─── Pomodoro ───

export async function startPomodoro(userId: string, taskId: string | null, durationMinutes: number): Promise<string> {
  const { data } = await supabase.from("pomodoro_sessions").insert({
    user_id: userId, task_id: taskId, duration_minutes: durationMinutes,
    completed: false, started_at: new Date().toISOString(),
  }).select("id").single();
  return data?.id ?? "";
}

export async function completePomodoro(sessionId: string, userId: string): Promise<void> {
  await supabase.from("pomodoro_sessions").update({
    completed: true, ended_at: new Date().toISOString(),
  }).eq("id", sessionId);
  await addXp(userId, XP_POMODORO_COMPLETE);
}

export async function getPomodoroCount(userId: string): Promise<number> {
  const { count } = await supabase.from("pomodoro_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId).eq("completed", true);
  return count ?? 0;
}

export async function getPomodoroSessions(userId: string, limit = 20): Promise<PomodoroSession[]> {
  const { data } = await supabase.from("pomodoro_sessions").select("*")
    .eq("user_id", userId).order("started_at", { ascending: false }).limit(limit);
  return (data ?? []).map((r: any) => ({
    id: r.id, userId: r.user_id, taskId: r.task_id,
    durationMinutes: r.duration_minutes, completed: r.completed,
    startedAt: r.started_at, endedAt: r.ended_at,
  }));
}

// ─── Templates ───

export async function getTemplates(userId: string): Promise<TaskTemplate[]> {
  const { data } = await supabase.from("task_templates").select("*")
    .or(`user_id.eq.${userId},is_system.eq.true`).order("is_system", { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id, userId: r.user_id, name: r.name, description: r.description,
    isSystem: r.is_system, templateTasks: r.template_tasks ?? [],
  }));
}

export async function saveTemplate(t: TaskTemplate): Promise<void> {
  await supabase.from("task_templates").insert({
    user_id: t.userId, name: t.name, description: t.description,
    template_tasks: t.templateTasks, is_system: false,
  });
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await supabase.from("task_templates").delete().eq("id", templateId).eq("is_system", false);
}

// ─── Stats & Reports ───

export async function getDailyStatsRange(
  userId: string, startDate: string, endDate: string
): Promise<Map<string, DayStats>> {
  const { data } = await supabase.rpc("get_daily_stats", {
    p_user_id: userId, p_start_date: startDate, p_end_date: endDate,
  });
  const map = new Map<string, DayStats>();
  for (const row of data ?? []) {
    const total = Number(row.total_tasks);
    const completed = Number(row.completed_tasks);
    map.set(row.date, { date: row.date, totalTasks: total, completedTasks: completed, completionRate: total > 0 ? completed / total : 0 });
  }
  return map;
}

export async function getStreak(userId: string): Promise<number> {
  const today = new Date();
  const lookback = new Date(today);
  lookback.setDate(lookback.getDate() - 365);
  const statsMap = await getDailyStatsRange(userId, formatDate(lookback), formatDate(today));

  let streak = 0;
  const d = new Date(today);

  const todayStats = statsMap.get(formatDate(today));
  if (todayStats && todayStats.totalTasks > 0 && todayStats.completionRate === 1) streak = 1;
  d.setDate(d.getDate() - (streak > 0 ? 1 : 0));

  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(d);
    const stats = statsMap.get(dateStr);
    if (!stats || stats.totalTasks === 0) { d.setDate(d.getDate() - 1); continue; }
    if (stats.completionRate === 1) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export async function getLongestStreak(userId: string): Promise<number> {
  const allTasks = await getTasks(userId);
  if (allTasks.length === 0) return 0;
  const dates = Array.from(new Set(allTasks.map((t) => t.date))).sort();
  if (dates.length === 0) return 0;
  const statsMap = await getDailyStatsRange(userId, dates[0], dates[dates.length - 1]);

  let longest = 0, current = 0;
  const d = new Date(dates[0] + "T12:00:00");
  const end = new Date(dates[dates.length - 1] + "T12:00:00");
  while (d <= end) {
    const stats = statsMap.get(formatDate(d));
    if (stats && stats.totalTasks > 0 && stats.completionRate === 1) { current++; longest = Math.max(longest, current); }
    else if (stats && stats.totalTasks > 0) current = 0;
    d.setDate(d.getDate() + 1);
  }
  return longest;
}

export async function computeRadar(userId: string, startDate: string, endDate: string): Promise<RadarData> {
  const tasks = await getTasksForDateRange(userId, startDate, endDate);
  if (tasks.length === 0) return { discipline: 0, completion: 0, consistency: 0, difficulty: 0, streakScore: 0 };

  const completed = tasks.filter((t) => t.isCompleted);
  const completion = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

  const statsMap = await getDailyStatsRange(userId, startDate, endDate);
  let activeDays = 0, perfectDays = 0;
  statsMap.forEach((s) => {
    if (s.totalTasks > 0) { activeDays++; if (s.completionRate === 1) perfectDays++; }
  });
  const totalDays = Math.max(1, Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));
  const consistency = Math.min(100, (activeDays / totalDays) * 100);
  const discipline = activeDays > 0 ? (perfectDays / activeDays) * 100 : 0;

  const avgDifficulty = tasks.length > 0 ? tasks.reduce((s, t) => s + t.difficulty, 0) / tasks.length : 1;
  const difficultyScore = ((avgDifficulty - 1) / 2) * 100;

  const streak = await getStreak(userId);
  const streakScore = Math.min(100, streak * 3.33);

  return {
    discipline: Math.round(discipline),
    completion: Math.round(completion),
    consistency: Math.round(consistency),
    difficulty: Math.round(difficultyScore),
    streakScore: Math.round(streakScore),
  };
}

export async function getWeeklyReport(userId: string, weekStart: Date): Promise<WeeklyReport> {
  const dates = getWeekDates(weekStart);
  const startStr = formatDate(dates[0]);
  const endStr = formatDate(dates[6]);

  const [tasks, categories, radar] = await Promise.all([
    getTasksForDateRange(userId, startStr, endStr),
    getCategories(userId),
    computeRadar(userId, startStr, endStr),
  ]);

  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const xpEarned = tasks.filter((t) => t.isCompleted).reduce((s, t) => s + (XP_PER_DIFFICULTY[t.difficulty] || 10), 0);

  const categoryBreakdown = categories
    .map((cat) => {
      const catTasks = tasks.filter((t) => t.categoryId === cat.id);
      return { category: cat.name, color: cat.color, count: catTasks.length, completed: catTasks.filter((t) => t.isCompleted).length };
    })
    .filter((c) => c.count > 0);

  const dailyBreakdown = dates.map((d) => {
    const dateStr = formatDate(d);
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    return { date: dateStr, day: d.toLocaleDateString("en-US", { weekday: "short" }), total: dayTasks.length, completed: dayTasks.filter((t) => t.isCompleted).length };
  });

  let streakDays = 0;
  for (const db of dailyBreakdown) { if (db.total > 0 && db.completed === db.total) streakDays++; }

  return {
    weekStart: startStr, weekEnd: endStr, totalTasks: tasks.length,
    completedTasks, completionRate: tasks.length > 0 ? completedTasks / tasks.length : 0,
    streakDays, xpEarned, categoryBreakdown, dailyBreakdown, radar,
    topPriority: {
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    },
  };
}

export async function getHeatmapData(userId: string, year: number): Promise<HeatmapDay[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const statsMap = await getDailyStatsRange(userId, startDate, endDate);

  const days: HeatmapDay[] = [];
  const d = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  while (d <= end) {
    const dateStr = formatDate(d);
    const stats = statsMap.get(dateStr);
    const total = stats?.totalTasks ?? 0;
    const completed = stats?.completedTasks ?? 0;
    const rate = total > 0 ? completed / total : 0;
    days.push({ date: dateStr, count: getHeatmapLevel(rate), totalTasks: total, completedTasks: completed });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// ─── Public Profile ───

export async function getUserBySlug(slug: string): Promise<User | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("public_slug", slug).eq("is_profile_public", true).single();
  if (error || !data) return null;
  return rowToUser(data);
}

export async function getPublicProfileData(slug: string): Promise<PublicProfileData | null> {
  const user = await getUserBySlug(slug);
  if (!user) return null;

  const year = new Date().getFullYear();
  const [allTasks, categories, heatmapData, achievements] = await Promise.all([
    getTasks(user.id), getCategories(user.id), getHeatmapData(user.id, year), getUserAchievements(user.id),
  ]);

  const completedAll = allTasks.filter((t) => t.isCompleted).length;
  const perfectDays = heatmapData.filter((d) => d.totalTasks > 0 && d.completedTasks === d.totalTasks).length;
  const activeDays = heatmapData.filter((d) => d.totalTasks > 0).length;

  const categoryBreakdown = categories
    .map((cat) => {
      const catTasks = allTasks.filter((t) => t.categoryId === cat.id);
      return { name: cat.name, color: cat.color, count: catTasks.length, completed: catTasks.filter((t) => t.isCompleted).length };
    })
    .filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  const today = new Date();
  const lookbackStart = new Date(today);
  lookbackStart.setDate(lookbackStart.getDate() - 29);
  const statsMap = await getDailyStatsRange(user.id, formatDate(lookbackStart), formatDate(today));
  const last30: { date: string; total: number; completed: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const dd = new Date(today); dd.setDate(dd.getDate() - i);
    const dateStr = formatDate(dd);
    const stats = statsMap.get(dateStr);
    last30.push({ date: dateStr, total: stats?.totalTasks ?? 0, completed: stats?.completedTasks ?? 0 });
  }

  const [currentStreak, longestStreak] = await Promise.all([getStreak(user.id), getLongestStreak(user.id)]);

  return {
    user: { name: user.name, bio: user.bio, publicSlug: user.publicSlug, memberSince: user.createdAt },
    currentStreak, longestStreak, totalTasksAllTime: allTasks.length, completedTasksAllTime: completedAll,
    perfectDays, activeDays, xp: user.xp, level: user.level,
    heatmapData, categoryBreakdown, last30Days: last30, achievements,
  };
}
