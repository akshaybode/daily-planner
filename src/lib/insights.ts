import { Task, Category } from "./types";
import * as store from "./store";
import { formatDate } from "./utils";

export type InsightPeriod = "weekly" | "monthly" | "quarterly" | "yearly";

export interface InsightData {
  period: InsightPeriod;
  periodLabel: string;
  dateRange: string;
  isUnlocked: boolean;
  unlockMessage: string;
  summary: string;
  highlights: string[];
  achievements: Achievement[];
  topCategories: { name: string; color: string; count: number; completionRate: number }[];
  streakInfo: { current: number; longest: number; perfectDays: number };
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  trend: "up" | "down" | "stable";
  trendMessage: string;
}

export interface Achievement {
  icon: string;
  title: string;
  description: string;
  type: "milestone" | "streak" | "consistency" | "category";
}

function getDaysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getDateRange(period: InsightPeriod): { start: Date; end: Date; label: string; range: string } {
  const now = new Date();
  const end = new Date(now);

  switch (period) {
    case "weekly": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { start, end, label: "This Week", range: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` };
    }
    case "monthly": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { start, end, label: "Last 30 Days", range: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` };
    }
    case "quarterly": {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return { start, end, label: "Last 3 Months", range: `${start.toLocaleDateString("en-US", { month: "short", year: "numeric" })} — ${end.toLocaleDateString("en-US", { month: "short", year: "numeric" })}` };
    }
    case "yearly": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end, label: `${now.getFullYear()} Year in Review`, range: `Jan 1 — ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` };
    }
  }
}

function getTasksInRange(allTasks: Task[], start: Date, end: Date): Task[] {
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  return allTasks.filter((t) => t.date >= startStr && t.date <= endStr);
}

function generateAchievements(tasks: Task[], categories: Category[], period: InsightPeriod, perfectDays: number, streak: number): Achievement[] {
  const achievements: Achievement[] = [];
  const completed = tasks.filter((t) => t.isCompleted);

  if (completed.length >= 100) {
    achievements.push({ icon: "trophy", title: "Century Club", description: `Completed ${completed.length} tasks — triple digits!`, type: "milestone" });
  } else if (completed.length >= 50) {
    achievements.push({ icon: "trophy", title: "Half Century", description: `${completed.length} tasks completed — halfway to 100!`, type: "milestone" });
  } else if (completed.length >= 25) {
    achievements.push({ icon: "star", title: "Solid Progress", description: `${completed.length} tasks done — you're building momentum.`, type: "milestone" });
  } else if (completed.length >= 10) {
    achievements.push({ icon: "zap", title: "Getting Started", description: `${completed.length} tasks completed — keep the rhythm going!`, type: "milestone" });
  }

  if (streak >= 30) {
    achievements.push({ icon: "flame", title: "Unstoppable", description: `${streak}-day streak — a full month of consistency!`, type: "streak" });
  } else if (streak >= 14) {
    achievements.push({ icon: "flame", title: "On Fire", description: `${streak}-day streak — two weeks strong!`, type: "streak" });
  } else if (streak >= 7) {
    achievements.push({ icon: "flame", title: "Week Warrior", description: `${streak}-day streak — a full week!`, type: "streak" });
  } else if (streak >= 3) {
    achievements.push({ icon: "flame", title: "Streak Builder", description: `${streak}-day streak — keep it alive!`, type: "streak" });
  }

  if (perfectDays >= 7) {
    achievements.push({ icon: "crown", title: "Perfectionist", description: `${perfectDays} days with 100% completion`, type: "consistency" });
  }

  const catCounts: Record<string, number> = {};
  for (const t of completed) catCounts[t.categoryId] = (catCounts[t.categoryId] || 0) + 1;

  for (const [catId, count] of Object.entries(catCounts)) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) continue;
    const pLabel = period === "weekly" ? "week" : period === "monthly" ? "month" : period === "quarterly" ? "quarter" : "year";
    if (count >= 20) {
      achievements.push({ icon: "badge", title: `${cat.name} Champion`, description: `You did ${cat.name} ${count} times this ${pLabel}!`, type: "category" });
    } else if (count >= 10) {
      achievements.push({ icon: "badge", title: `${cat.name} Regular`, description: `${count} ${cat.name.toLowerCase()} tasks completed — impressive dedication.`, type: "category" });
    }
  }

  return achievements;
}

function generateSummary(tasks: Task[], categories: Category[], period: InsightPeriod, completionRate: number, perfectDays: number, streak: number, userName: string): string {
  const completed = tasks.filter((t) => t.isCompleted).length;
  const total = tasks.length;
  const pct = Math.round(completionRate * 100);

  if (total === 0) return `No tasks were planned during this period. Start adding tasks to get personalized insights and track your growth!`;

  const periodName = period === "weekly" ? "week" : period === "monthly" ? "month" : period === "quarterly" ? "quarter" : "year";
  const catCounts: Record<string, number> = {};
  for (const t of tasks.filter((t) => t.isCompleted)) catCounts[t.categoryId] = (catCounts[t.categoryId] || 0) + 1;
  const topCatId = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
  const topCat = topCatId ? categories.find((c) => c.id === topCatId[0]) : null;

  const parts: string[] = [];
  if (pct >= 90) parts.push(`Outstanding ${periodName}, ${userName.split(" ")[0]}! You completed ${completed} out of ${total} tasks with a ${pct}% completion rate.`);
  else if (pct >= 70) parts.push(`Great ${periodName}! You knocked out ${completed} of ${total} tasks (${pct}% completion).`);
  else if (pct >= 50) parts.push(`Decent progress this ${periodName} — ${completed} of ${total} tasks done (${pct}%).`);
  else parts.push(`This ${periodName} you completed ${completed} of ${total} tasks (${pct}%). Every task done is a step forward.`);

  if (topCat && topCatId) parts.push(`Your top focus area was ${topCat.name} with ${topCatId[1]} tasks completed.`);
  if (perfectDays > 0) parts.push(`You had ${perfectDays} perfect day${perfectDays > 1 ? "s" : ""} where every single task was completed.`);
  if (streak >= 7) parts.push(`Your current ${streak}-day streak shows real commitment — keep it going!`);
  else if (streak >= 3) parts.push(`You're on a ${streak}-day streak. A few more days and you'll hit a full week!`);

  const highPriority = tasks.filter((t) => t.priority === "high");
  const highCompleted = highPriority.filter((t) => t.isCompleted).length;
  if (highPriority.length > 0) parts.push(`Of your ${highPriority.length} high-priority tasks, ${highCompleted} were completed.`);

  return parts.join(" ");
}

function generateHighlights(tasks: Task[], categories: Category[], perfectDays: number, completionRate: number): string[] {
  const highlights: string[] = [];
  const completed = tasks.filter((t) => t.isCompleted);

  if (completed.length > 0) highlights.push(`Completed ${completed.length} task${completed.length !== 1 ? "s" : ""} total`);
  highlights.push(`${Math.round(completionRate * 100)}% overall completion rate`);
  if (perfectDays > 0) highlights.push(`${perfectDays} perfect day${perfectDays !== 1 ? "s" : ""} (all tasks done)`);

  const catCounts: Record<string, number> = {};
  for (const t of completed) catCounts[t.categoryId] = (catCounts[t.categoryId] || 0) + 1;
  for (const [catId, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)) {
    const cat = categories.find((c) => c.id === catId);
    if (cat) highlights.push(`${cat.name}: ${count} tasks completed`);
  }

  const recurring = tasks.filter((t) => t.isRecurring);
  if (recurring.length > 0) highlights.push(`${recurring.filter((t) => t.isCompleted).length}/${recurring.length} recurring tasks maintained`);

  return highlights;
}

async function computeTrend(userId: string, periodDays: number): Promise<{ trend: "up" | "down" | "stable"; message: string }> {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - periodDays);
  const prevStart = new Date(currentStart);
  prevStart.setDate(prevStart.getDate() - periodDays);

  const allTasks = await store.getTasks(userId);
  const currentTasks = getTasksInRange(allTasks, currentStart, now);
  const prevTasks = getTasksInRange(allTasks, prevStart, currentStart);

  const currentRate = currentTasks.length > 0 ? currentTasks.filter((t) => t.isCompleted).length / currentTasks.length : 0;
  const prevRate = prevTasks.length > 0 ? prevTasks.filter((t) => t.isCompleted).length / prevTasks.length : 0;
  const diff = Math.round((currentRate - prevRate) * 100);

  if (prevTasks.length === 0) return { trend: "stable", message: "Not enough history for comparison yet." };
  if (diff > 5) return { trend: "up", message: `Completion rate is up ${diff}% compared to the previous period. You're improving!` };
  if (diff < -5) return { trend: "down", message: `Completion rate dropped ${Math.abs(diff)}% from last period. Try to push a little harder!` };
  return { trend: "stable", message: "Consistent performance compared to last period. Steady and reliable!" };
}

export async function isInsightUnlocked(userId: string, period: InsightPeriod): Promise<{ unlocked: boolean; message: string }> {
  const profile = await store.getProfile(userId);
  if (!profile) return { unlocked: false, message: "User not found." };

  const allTasks = await store.getTasks(userId);
  const daysWithTasks = new Set(allTasks.map((t) => t.date)).size;

  switch (period) {
    case "weekly":
      if (daysWithTasks >= 7) return { unlocked: true, message: "" };
      return { unlocked: false, message: `Log tasks for ${7 - daysWithTasks} more day${7 - daysWithTasks !== 1 ? "s" : ""} to unlock your weekly AI summary.` };
    case "monthly":
      if (daysWithTasks >= 30) return { unlocked: true, message: "" };
      return { unlocked: false, message: `Log tasks for ${30 - daysWithTasks} more day${30 - daysWithTasks !== 1 ? "s" : ""} to unlock your monthly reflection.` };
    case "quarterly":
      if (daysWithTasks >= 60) return { unlocked: true, message: "" };
      return { unlocked: false, message: `Log tasks for ${60 - daysWithTasks} more day${60 - daysWithTasks !== 1 ? "s" : ""} to unlock your quarterly reflection.` };
    case "yearly":
      if (daysWithTasks >= 90) return { unlocked: true, message: "" };
      return { unlocked: false, message: `Log tasks for ${90 - daysWithTasks} more day${90 - daysWithTasks !== 1 ? "s" : ""} to unlock your yearly reflection.` };
  }
}

export async function generateInsight(userId: string, period: InsightPeriod): Promise<InsightData> {
  const profile = await store.getProfile(userId);
  const userName = profile?.name || "there";
  const { start, end, label, range } = getDateRange(period);
  const { unlocked, message: unlockMessage } = await isInsightUnlocked(userId, period);

  const [allTasks, categories] = await Promise.all([
    store.getTasks(userId),
    store.getCategories(userId),
  ]);
  const tasks = getTasksInRange(allTasks, start, end);

  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const completionRate = tasks.length > 0 ? completedTasks / tasks.length : 0;

  const statsMap = await store.getDailyStatsRange(userId, formatDate(start), formatDate(end));
  let perfectDays = 0;
  statsMap.forEach((s) => { if (s.totalTasks > 0 && s.completionRate === 1) perfectDays++; });

  const [streak, longestStreak] = await Promise.all([
    store.getStreak(userId),
    store.getLongestStreak(userId),
  ]);

  const catCounts = categories
    .map((cat) => {
      const catTasks = tasks.filter((t) => t.categoryId === cat.id);
      return { name: cat.name, color: cat.color, count: catTasks.length, completionRate: catTasks.length > 0 ? catTasks.filter((t) => t.isCompleted).length / catTasks.length : 0 };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const periodDays = period === "weekly" ? 7 : period === "monthly" ? 30 : period === "quarterly" ? 90 : 365;
  const { trend, message: trendMessage } = await computeTrend(userId, periodDays);

  const summary = generateSummary(tasks, categories, period, completionRate, perfectDays, streak, userName);
  const highlights = generateHighlights(tasks, categories, perfectDays, completionRate);
  const achievements = generateAchievements(tasks, categories, period, perfectDays, streak);

  return {
    period, periodLabel: label, dateRange: range,
    isUnlocked: unlocked, unlockMessage, summary, highlights, achievements,
    topCategories: catCounts,
    streakInfo: { current: streak, longest: longestStreak, perfectDays },
    completionRate, totalTasks: tasks.length, completedTasks, trend, trendMessage,
  };
}
