"use client";

import React, { useEffect, useState } from "react";
import { Achievement } from "@/lib/types";
import { getAllAchievementDefs, getUserAchievements } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Flame, Trophy, Crown, Zap, Star, Award, Timer, Target, Sun, Lock,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  flame: Flame, trophy: Trophy, crown: Crown, zap: Zap, star: Star,
  award: Award, timer: Timer, target: Target, sun: Sun,
};

interface AchievementBadgesProps {
  userId: string;
}

export default function AchievementBadges({ userId }: AchievementBadgesProps) {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserAchievements(userId).then((list) => {
      setUnlocked(new Set(list.map((a) => a.key)));
      setLoading(false);
    });
  }, [userId]);

  const allDefs = getAllAchievementDefs();
  const grouped = {
    milestone: allDefs.filter((a) => a.type === "milestone"),
    streak: allDefs.filter((a) => a.type === "streak"),
    consistency: allDefs.filter((a) => a.type === "consistency"),
    xp: allDefs.filter((a) => a.type === "xp"),
    pomodoro: allDefs.filter((a) => a.type === "pomodoro"),
  };

  const groupLabels: Record<string, string> = {
    milestone: "Task Milestones",
    streak: "Streak Achievements",
    consistency: "Consistency",
    xp: "XP & Levels",
    pomodoro: "Focus Sessions",
  };

  const typeColors: Record<string, string> = {
    milestone: "from-amber-400 to-amber-600",
    streak: "from-orange-400 to-red-500",
    consistency: "from-brand-400 to-brand-600",
    xp: "from-emerald-400 to-teal-600",
    pomodoro: "from-blue-400 to-indigo-600",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const totalUnlocked = allDefs.filter((a) => unlocked.has(a.key)).length;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold">Achievements</h2>
        </div>
        <p className="text-surface-500">
          {totalUnlocked} of {allDefs.length} unlocked
        </p>
      </div>

      <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${(totalUnlocked / allDefs.length) * 100}%` }}
        />
      </div>

      {Object.entries(grouped).map(([type, achievements]) => (
        <div key={type}>
          <h3 className="text-sm font-bold text-surface-500 uppercase tracking-wider mb-3">{groupLabels[type]}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {achievements.map((a) => {
              const isUnlocked = unlocked.has(a.key);
              const Icon = iconMap[a.icon] || Star;
              return (
                <div
                  key={a.key}
                  className={cn(
                    "relative rounded-2xl p-4 text-center transition-all",
                    isUnlocked
                      ? "glass-card shadow-lg"
                      : "bg-surface-100 dark:bg-surface-800/50 opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2",
                    isUnlocked
                      ? `bg-gradient-to-br ${typeColors[type]} shadow-lg`
                      : "bg-surface-200 dark:bg-surface-700"
                  )}>
                    {isUnlocked ? (
                      <Icon className="w-6 h-6 text-white" />
                    ) : (
                      <Lock className="w-5 h-5 text-surface-400" />
                    )}
                  </div>
                  <p className={cn("text-sm font-bold", !isUnlocked && "text-surface-400")}>{a.title}</p>
                  <p className="text-[11px] text-surface-500 mt-0.5">{a.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
