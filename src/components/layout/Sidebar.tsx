"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  BarChart3,
  Grid3X3,
  LogOut,
  Sparkles,
  Moon,
  Sun,
  X,
  Share2,
  Brain,
} from "lucide-react";

export type ViewType = "dashboard" | "weekly" | "monthly" | "report" | "heatmap" | "insights";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onShareProfile: () => void;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Today", icon: LayoutDashboard },
  { id: "weekly", label: "Weekly", icon: Calendar },
  { id: "monthly", label: "Monthly", icon: CalendarDays },
  { id: "report", label: "Reports", icon: BarChart3 },
  { id: "insights", label: "AI Insights", icon: Brain },
  { id: "heatmap", label: "Heatmap", icon: Grid3X3 },
];

export default function Sidebar({
  currentView,
  onViewChange,
  isMobileOpen,
  onMobileClose,
  onShareProfile,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const handleNav = (view: ViewType) => {
    onViewChange(view);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 z-50 flex flex-col",
          "bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800",
          "transition-transform duration-300 ease-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">PlanFlow</span>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden btn-ghost p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                "sidebar-link w-full",
                currentView === item.id && "sidebar-link-active"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 space-y-2 border-t border-surface-200 dark:border-surface-800">
          <button
            onClick={() => { onShareProfile(); onMobileClose(); }}
            className="sidebar-link w-full text-brand-500 hover:text-brand-600"
          >
            <Share2 className="w-5 h-5" />
            Share Profile
          </button>

          <button onClick={toggleTheme} className="sidebar-link w-full">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
