"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Timer, Brain, Trophy } from "lucide-react";
import { ViewType } from "./Sidebar";

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Today", icon: LayoutDashboard },
  { id: "weekly", label: "Week", icon: Calendar },
  { id: "pomodoro", label: "Focus", icon: Timer },
  { id: "insights", label: "Insights", icon: Brain },
  { id: "achievements", label: "Badges", icon: Trophy },
];

export default function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-t border-surface-200 dark:border-surface-800 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onViewChange(item.id)}
            className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[60px] transition-all duration-200",
              currentView === item.id ? "text-brand-500" : "text-surface-400 active:text-surface-600")}>
            <item.icon className={cn("w-5 h-5 transition-transform duration-200", currentView === item.id && "scale-110")} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
