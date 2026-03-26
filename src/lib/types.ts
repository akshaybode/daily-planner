export type Priority = "low" | "medium" | "high";
export type Difficulty = 1 | 2 | 3;

export type LinkType =
  | "youtube" | "notion" | "google_docs" | "google_sheets"
  | "github" | "figma" | "stackoverflow" | "generic";

export type AppTheme = "light" | "dark" | "solarized" | "github" | "system";

export interface TaskLink {
  id: string;
  url: string;
  title: string;
  linkType: LinkType;
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  priority: Priority;
  difficulty: Difficulty;
  categoryId: string;
  isCompleted: boolean;
  completedAt: string | null;
  estimatedMinutes: number;
  actualMinutes: number;
  links: TaskLink[];
  subTasks: SubTask[];
  isRecurring: boolean;
  recurrenceDays: string[];
  sortOrder: number;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  publicSlug: string;
  isProfilePublic: boolean;
  bio: string;
  xp: number;
  level: number;
  streakFreezes: number;
  streakFreezeUsedAt: string | null;
  createdAt: string;
  settings: UserSettings;
}

export interface UserSettings {
  theme: AppTheme;
  weekStartsOn: 0 | 1;
  reportDay: string;
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  type: "milestone" | "streak" | "consistency" | "category" | "xp" | "pomodoro";
  unlockedAt?: string;
}

export interface PomodoroSession {
  id: string;
  userId: string;
  taskId: string | null;
  durationMinutes: number;
  completed: boolean;
  startedAt: string;
  endedAt: string | null;
}

export interface TaskTemplate {
  id: string;
  userId: string | null;
  name: string;
  description: string;
  isSystem: boolean;
  templateTasks: TemplateTask[];
}

export interface TemplateTask {
  title: string;
  priority: Priority;
  difficulty: Difficulty;
  categoryHint: string;
  estimatedMinutes: number;
}

export interface RadarData {
  discipline: number;
  completion: number;
  consistency: number;
  difficulty: number;
  streakScore: number;
}

export interface PublicProfileData {
  user: { name: string; bio: string; publicSlug: string; memberSince: string };
  currentStreak: number;
  longestStreak: number;
  totalTasksAllTime: number;
  completedTasksAllTime: number;
  perfectDays: number;
  activeDays: number;
  xp: number;
  level: number;
  heatmapData: HeatmapDay[];
  categoryBreakdown: { name: string; color: string; count: number; completed: number }[];
  last30Days: { date: string; total: number; completed: number }[];
  achievements: Achievement[];
}

export interface DayStats {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  streakDays: number;
  xpEarned: number;
  categoryBreakdown: { category: string; color: string; count: number; completed: number }[];
  dailyBreakdown: { date: string; day: string; total: number; completed: number }[];
  topPriority: { high: number; medium: number; low: number };
  radar: RadarData;
}

export interface HeatmapDay {
  date: string;
  count: number;
  totalTasks: number;
  completedTasks: number;
}
