import { supabase } from "./supabase";
import {
  Task, Category, User, DayStats, WeeklyReport, HeatmapDay, PublicProfileData, TaskLink, SubTask,
} from "./types";
import { formatDate, getWeekDates, getHeatmapLevel } from "./utils";

// ─── Row ↔ Model mappers ───

function rowToTask(row: any): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? "",
    date: row.date,
    priority: row.priority,
    categoryId: row.category_id ?? "",
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    links: (row.task_links ?? []).map((l: any) => ({
      id: l.id, url: l.url, title: l.title, linkType: l.link_type,
    })),
    subTasks: (row.sub_tasks ?? []).map((s: any) => ({
      id: s.id, title: s.title, isCompleted: s.is_completed,
    })),
    isRecurring: row.is_recurring,
    recurrenceDays: row.recurrence_days ?? [],
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function rowToCategory(row: any): Category {
  return { id: row.id, userId: row.user_id, name: row.name, color: row.color, icon: row.icon };
}

function rowToUser(row: any): User {
  const s = row.settings ?? {};
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url ?? "",
    publicSlug: row.public_slug,
    isProfilePublic: row.is_profile_public ?? true,
    bio: row.bio ?? "",
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
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return rowToUser(data);
}

export async function updateProfile(user: User): Promise<void> {
  await supabase.from("profiles").update({
    name: user.name,
    bio: user.bio,
    is_profile_public: user.isProfilePublic,
    avatar_url: user.avatarUrl,
    settings: user.settings,
  }).eq("id", user.id);
}

// ─── Categories ───

export async function getCategories(userId: string): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  return (data ?? []).map(rowToCategory);
}

export async function addCategory(cat: Category): Promise<void> {
  await supabase.from("categories").insert({
    id: cat.id, user_id: cat.userId, name: cat.name, color: cat.color, icon: cat.icon,
  });
}

// ─── Tasks ───

export async function getTasks(userId: string): Promise<Task[]> {
  const { data } = await supabase
    .from("tasks")
    .select("*, task_links(*), sub_tasks(*)")
    .eq("user_id", userId)
    .order("sort_order");
  return (data ?? []).map(rowToTask);
}

export async function getTasksByDate(userId: string, date: string): Promise<Task[]> {
  const { data } = await supabase
    .from("tasks")
    .select("*, task_links(*), sub_tasks(*)")
    .eq("user_id", userId)
    .eq("date", date)
    .order("sort_order");
  return (data ?? []).map(rowToTask);
}

export async function getTasksForDateRange(userId: string, startDate: string, endDate: string): Promise<Task[]> {
  const { data } = await supabase
    .from("tasks")
    .select("*, task_links(*), sub_tasks(*)")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("sort_order");
  return (data ?? []).map(rowToTask);
}

export async function addTask(task: Task): Promise<void> {
  const { data: inserted } = await supabase.from("tasks").insert({
    user_id: task.userId,
    title: task.title,
    description: task.description,
    date: task.date,
    priority: task.priority,
    category_id: task.categoryId || null,
    is_completed: false,
    is_recurring: task.isRecurring,
    recurrence_days: task.recurrenceDays,
    sort_order: task.sortOrder,
  }).select("id").single();

  if (!inserted) return;
  const taskId = inserted.id;

  if (task.links.length > 0) {
    await supabase.from("task_links").insert(
      task.links.map((l, i) => ({
        task_id: taskId, url: l.url, title: l.title, link_type: l.linkType, sort_order: i,
      }))
    );
  }
  if (task.subTasks.length > 0) {
    await supabase.from("sub_tasks").insert(
      task.subTasks.map((s, i) => ({
        task_id: taskId, title: s.title, is_completed: false, sort_order: i,
      }))
    );
  }
}

export async function updateTask(task: Task): Promise<void> {
  await supabase.from("tasks").update({
    title: task.title,
    description: task.description,
    date: task.date,
    priority: task.priority,
    category_id: task.categoryId || null,
    is_completed: task.isCompleted,
    completed_at: task.completedAt,
    is_recurring: task.isRecurring,
    recurrence_days: task.recurrenceDays,
    sort_order: task.sortOrder,
  }).eq("id", task.id);

  // Replace links
  await supabase.from("task_links").delete().eq("task_id", task.id);
  if (task.links.length > 0) {
    await supabase.from("task_links").insert(
      task.links.map((l, i) => ({
        task_id: task.id, url: l.url, title: l.title, link_type: l.linkType, sort_order: i,
      }))
    );
  }

  // Replace sub-tasks
  await supabase.from("sub_tasks").delete().eq("task_id", task.id);
  if (task.subTasks.length > 0) {
    await supabase.from("sub_tasks").insert(
      task.subTasks.map((s, i) => ({
        task_id: task.id, title: s.title, is_completed: s.isCompleted, sort_order: i,
      }))
    );
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  await supabase.from("tasks").delete().eq("id", taskId);
}

export async function toggleTaskComplete(taskId: string): Promise<Task | null> {
  const { data: current } = await supabase
    .from("tasks")
    .select("is_completed")
    .eq("id", taskId)
    .single();
  if (!current) return null;

  const newVal = !current.is_completed;
  await supabase.from("tasks").update({
    is_completed: newVal,
    completed_at: newVal ? new Date().toISOString() : null,
  }).eq("id", taskId);

  const { data: updated } = await supabase
    .from("tasks")
    .select("*, task_links(*), sub_tasks(*)")
    .eq("id", taskId)
    .single();
  return updated ? rowToTask(updated) : null;
}

export async function updateSubTask(taskId: string, subTaskId: string, isCompleted: boolean): Promise<void> {
  await supabase.from("sub_tasks").update({ is_completed: isCompleted }).eq("id", subTaskId);
}

// ─── Stats & Reports ───

export async function getDailyStatsRange(
  userId: string, startDate: string, endDate: string
): Promise<Map<string, DayStats>> {
  const { data } = await supabase.rpc("get_daily_stats", {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  const map = new Map<string, DayStats>();
  for (const row of data ?? []) {
    const total = Number(row.total_tasks);
    const completed = Number(row.completed_tasks);
    map.set(row.date, {
      date: row.date,
      totalTasks: total,
      completedTasks: completed,
      completionRate: total > 0 ? completed / total : 0,
    });
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
  if (todayStats && todayStats.totalTasks > 0 && todayStats.completionRate === 1) {
    streak = 1;
  }

  d.setDate(d.getDate() - (streak > 0 ? 1 : 0));

  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(d);
    const stats = statsMap.get(dateStr);
    if (!stats || stats.totalTasks === 0) {
      d.setDate(d.getDate() - 1);
      continue;
    }
    if (stats.completionRate === 1) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function getLongestStreak(userId: string): Promise<number> {
  const allTasks = await getTasks(userId);
  if (allTasks.length === 0) return 0;

  const dates = Array.from(new Set(allTasks.map((t) => t.date))).sort();
  if (dates.length === 0) return 0;

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const statsMap = await getDailyStatsRange(userId, startDate, endDate);

  let longest = 0;
  let current = 0;
  const d = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");

  while (d <= end) {
    const stats = statsMap.get(formatDate(d));
    if (stats && stats.totalTasks > 0 && stats.completionRate === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (stats && stats.totalTasks > 0) {
      current = 0;
    }
    d.setDate(d.getDate() + 1);
  }
  return longest;
}

export async function getWeeklyReport(userId: string, weekStart: Date): Promise<WeeklyReport> {
  const dates = getWeekDates(weekStart);
  const startStr = formatDate(dates[0]);
  const endStr = formatDate(dates[6]);

  const [tasks, categories] = await Promise.all([
    getTasksForDateRange(userId, startStr, endStr),
    getCategories(userId),
  ]);

  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  const categoryBreakdown = categories
    .map((cat) => {
      const catTasks = tasks.filter((t) => t.categoryId === cat.id);
      return {
        category: cat.name, color: cat.color,
        count: catTasks.length,
        completed: catTasks.filter((t) => t.isCompleted).length,
      };
    })
    .filter((c) => c.count > 0);

  const dailyBreakdown = dates.map((d) => {
    const dateStr = formatDate(d);
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    return {
      date: dateStr,
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      total: dayTasks.length,
      completed: dayTasks.filter((t) => t.isCompleted).length,
    };
  });

  let streakDays = 0;
  for (const db of dailyBreakdown) {
    if (db.total > 0 && db.completed === db.total) streakDays++;
  }

  return {
    weekStart: startStr,
    weekEnd: endStr,
    totalTasks: tasks.length,
    completedTasks,
    completionRate: tasks.length > 0 ? completedTasks / tasks.length : 0,
    streakDays,
    categoryBreakdown,
    dailyBreakdown,
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
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("public_slug", slug)
    .eq("is_profile_public", true)
    .single();
  if (error || !data) return null;
  return rowToUser(data);
}

export async function getPublicProfileData(slug: string): Promise<PublicProfileData | null> {
  const user = await getUserBySlug(slug);
  if (!user) return null;

  const year = new Date().getFullYear();
  const [allTasks, categories, heatmapData] = await Promise.all([
    getTasks(user.id),
    getCategories(user.id),
    getHeatmapData(user.id, year),
  ]);

  const completedAll = allTasks.filter((t) => t.isCompleted).length;
  const perfectDays = heatmapData.filter((d) => d.totalTasks > 0 && d.completedTasks === d.totalTasks).length;
  const activeDays = heatmapData.filter((d) => d.totalTasks > 0).length;

  const categoryBreakdown = categories
    .map((cat) => {
      const catTasks = allTasks.filter((t) => t.categoryId === cat.id);
      return {
        name: cat.name, color: cat.color, count: catTasks.length,
        completed: catTasks.filter((t) => t.isCompleted).length,
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const today = new Date();
  const last30: { date: string; total: number; completed: number }[] = [];
  const lookbackStart = new Date(today);
  lookbackStart.setDate(lookbackStart.getDate() - 29);
  const statsMap = await getDailyStatsRange(user.id, formatDate(lookbackStart), formatDate(today));

  for (let i = 29; i >= 0; i--) {
    const dd = new Date(today);
    dd.setDate(dd.getDate() - i);
    const dateStr = formatDate(dd);
    const stats = statsMap.get(dateStr);
    last30.push({ date: dateStr, total: stats?.totalTasks ?? 0, completed: stats?.completedTasks ?? 0 });
  }

  const [currentStreak, longestStreak] = await Promise.all([
    getStreak(user.id),
    getLongestStreak(user.id),
  ]);

  return {
    user: { name: user.name, bio: user.bio, publicSlug: user.publicSlug, memberSince: user.createdAt },
    currentStreak, longestStreak,
    totalTasksAllTime: allTasks.length,
    completedTasksAllTime: completedAll,
    perfectDays, activeDays, heatmapData, categoryBreakdown, last30Days: last30,
  };
}
