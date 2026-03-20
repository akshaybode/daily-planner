export type Priority = "low" | "medium" | "high";

export type LinkType =
  | "youtube"
  | "notion"
  | "google_docs"
  | "google_sheets"
  | "github"
  | "figma"
  | "stackoverflow"
  | "generic";

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
  date: string; // ISO date string YYYY-MM-DD
  priority: Priority;
  categoryId: string;
  isCompleted: boolean;
  completedAt: string | null;
  links: TaskLink[];
  subTasks: SubTask[];
  isRecurring: boolean;
  recurrenceDays: string[]; // ["mon","tue",...]
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
  createdAt: string;
  settings: UserSettings;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  weekStartsOn: 0 | 1; // 0=Sunday, 1=Monday
  reportDay: string; // "sunday"
}

export interface PublicProfileData {
  user: {
    name: string;
    bio: string;
    publicSlug: string;
    memberSince: string;
  };
  currentStreak: number;
  longestStreak: number;
  totalTasksAllTime: number;
  completedTasksAllTime: number;
  perfectDays: number;
  activeDays: number;
  heatmapData: HeatmapDay[];
  categoryBreakdown: { name: string; color: string; count: number; completed: number }[];
  last30Days: { date: string; total: number; completed: number }[];
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
  categoryBreakdown: { category: string; color: string; count: number; completed: number }[];
  dailyBreakdown: { date: string; day: string; total: number; completed: number }[];
  topPriority: { high: number; medium: number; low: number };
}

export interface HeatmapDay {
  date: string;
  count: number; // 0-4 intensity level
  totalTasks: number;
  completedTasks: number;
}
