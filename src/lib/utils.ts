import { LinkType } from "./types";

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getDayName(date: Date, format: "short" | "long" = "short"): string {
  return date.toLocaleDateString("en-US", { weekday: format });
}

export function getMonthName(date: Date, format: "short" | "long" = "long"): string {
  return date.toLocaleDateString("en-US", { month: format });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function getWeekDates(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function getMonthDates(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  const dates: (Date | null)[] = [];
  for (let i = 0; i < startPadding; i++) dates.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    dates.push(new Date(year, month, d));
  }
  return dates;
}

export function detectLinkType(url: string): LinkType {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be"))
      return "youtube";
    if (hostname.includes("notion.so") || hostname.includes("notion.site"))
      return "notion";
    if (hostname.includes("docs.google.com")) return "google_docs";
    if (hostname.includes("sheets.google.com")) return "google_sheets";
    if (hostname.includes("github.com")) return "github";
    if (hostname.includes("figma.com")) return "figma";
    if (hostname.includes("stackoverflow.com")) return "stackoverflow";
    return "generic";
  } catch {
    return "generic";
  }
}

export function getLinkIcon(type: LinkType): string {
  const icons: Record<LinkType, string> = {
    youtube: "Play",
    notion: "FileText",
    google_docs: "FileText",
    google_sheets: "Table",
    github: "Github",
    figma: "Figma",
    stackoverflow: "MessageSquare",
    generic: "Link",
  };
  return icons[type];
}

export function getLinkColor(type: LinkType): string {
  const colors: Record<LinkType, string> = {
    youtube: "text-red-500",
    notion: "text-gray-700 dark:text-gray-300",
    google_docs: "text-blue-500",
    google_sheets: "text-green-500",
    github: "text-gray-800 dark:text-gray-200",
    figma: "text-purple-500",
    stackoverflow: "text-orange-500",
    generic: "text-brand-500",
  };
  return colors[type];
}

export function getHeatmapLevel(completionRate: number): number {
  if (completionRate === 0) return 0;
  if (completionRate <= 0.25) return 1;
  if (completionRate <= 0.5) return 2;
  if (completionRate <= 0.75) return 3;
  return 4;
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substring(2) + Date.now().toString(36);
}
