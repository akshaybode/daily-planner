"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Calendar, CalendarDays, BarChart3, Grid3X3,
  LogOut, Sparkles, Moon, Sun, X, Share2, Brain, Timer,
  Trophy, BookOpen, Maximize2, Palette, KeyRound,
} from "lucide-react";
import { AppTheme } from "@/lib/types";
import XpBar from "@/components/gamification/XpBar";

export type ViewType =
  | "dashboard" | "weekly" | "monthly" | "report" | "heatmap"
  | "insights" | "pomodoro" | "achievements" | "templates";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onShareProfile: () => void;
  onZenMode: () => void;
  onChangePassword: () => void;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Today", icon: LayoutDashboard },
  { id: "weekly", label: "Weekly", icon: Calendar },
  { id: "monthly", label: "Monthly", icon: CalendarDays },
  { id: "pomodoro", label: "Focus Timer", icon: Timer },
  { id: "report", label: "Reports", icon: BarChart3 },
  { id: "insights", label: "AI Insights", icon: Brain },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "templates", label: "Templates", icon: BookOpen },
  { id: "heatmap", label: "Heatmap", icon: Grid3X3 },
];

const THEMES: { id: AppTheme; label: string; colors: string }[] = [
  { id: "light", label: "Light", colors: "bg-white border-surface-300" },
  { id: "dark", label: "Dark", colors: "bg-surface-800 border-surface-600" },
  { id: "solarized", label: "Solar", colors: "bg-amber-100 border-amber-400" },
  { id: "github", label: "GitHub", colors: "bg-emerald-100 border-emerald-400" },
  { id: "system", label: "Auto", colors: "bg-gradient-to-r from-white to-surface-800 border-surface-400" },
];

export default function Sidebar({
  currentView, onViewChange, isMobileOpen, onMobileClose, onShareProfile, onZenMode, onChangePassword,
}: SidebarProps) {
  const { user, logout, updateUser } = useAuth();
  const [showThemes, setShowThemes] = React.useState(false);

  const applyTheme = (theme: AppTheme) => {
    const html = document.documentElement;
    html.classList.remove("dark", "theme-solarized", "theme-github");

    if (theme === "dark") {
      html.classList.add("dark");
    } else if (theme === "solarized") {
      html.classList.add("theme-solarized");
    } else if (theme === "github") {
      html.classList.add("theme-github");
    } else if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) html.classList.add("dark");
    }

    if (user) {
      updateUser({ ...user, settings: { ...user.settings, theme } });
    }
    setShowThemes(false);
  };

  const handleNav = (view: ViewType) => {
    onViewChange(view);
    onMobileClose();
  };

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onMobileClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 z-50 flex flex-col",
        "bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800",
        "transition-transform duration-300 ease-out",
        "lg:translate-x-0 lg:static lg:z-auto",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">PlanFlow</span>
          </div>
          <button onClick={onMobileClose} className="lg:hidden btn-ghost p-2"><X className="w-5 h-5" /></button>
        </div>

        {user && (
          <div className="px-4 pb-3">
            <XpBar xp={user.xp} level={user.level} streakFreezes={user.streakFreezes} compact />
          </div>
        )}

        <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => handleNav(item.id)} className={cn("sidebar-link w-full", currentView === item.id && "sidebar-link-active")}>
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-1.5 border-t border-surface-200 dark:border-surface-800">
          <button onClick={() => { onZenMode(); onMobileClose(); }} className="sidebar-link w-full text-emerald-600 dark:text-emerald-400">
            <Maximize2 className="w-5 h-5" /> Zen Mode
          </button>
          <button onClick={() => { onShareProfile(); onMobileClose(); }} className="sidebar-link w-full text-brand-500 hover:text-brand-600">
            <Share2 className="w-5 h-5" /> Share Profile
          </button>

          <div className="relative">
            <button onClick={() => setShowThemes(!showThemes)} className="sidebar-link w-full">
              <Palette className="w-5 h-5" /> Theme
            </button>
            {showThemes && (
              <div className="absolute bottom-full left-0 mb-1 w-full p-2 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 z-10">
                <div className="grid grid-cols-5 gap-1.5">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => applyTheme(t.id)} title={t.label}
                      className={cn("w-full aspect-square rounded-lg border-2 transition-all hover:scale-110", t.colors,
                        user?.settings.theme === t.id && "ring-2 ring-brand-500 ring-offset-1"
                      )} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button onClick={() => { onChangePassword(); onMobileClose(); }} className="sidebar-link w-full">
            <KeyRound className="w-5 h-5" /> Change Password
          </button>
          <button onClick={logout} className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
