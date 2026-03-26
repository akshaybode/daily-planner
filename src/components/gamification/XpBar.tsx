"use client";

import React from "react";
import { xpForLevel } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Zap, Shield, Star } from "lucide-react";

interface XpBarProps {
  xp: number;
  level: number;
  streakFreezes: number;
  compact?: boolean;
}

export default function XpBar({ xp, level, streakFreezes, compact }: XpBarProps) {
  const currentLevelXp = xpForLevel(level);
  const prevLevelXp = level > 1 ? xpForLevel(level - 1) : 0;
  const progressInLevel = xp - prevLevelXp;
  const levelRange = currentLevelXp - prevLevelXp;
  const pct = Math.min(100, (progressInLevel / levelRange) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Lv.{level}</span>
        </div>
        <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] text-surface-400 font-medium">{xp} XP</span>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <span className="text-white font-extrabold text-lg">{level}</span>
          </div>
          <div>
            <p className="text-sm font-bold">Level {level}</p>
            <div className="flex items-center gap-1 text-xs text-surface-500">
              <Zap className="w-3 h-3 text-amber-500" />
              {xp} / {currentLevelXp} XP
            </div>
          </div>
        </div>
        {streakFreezes > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{streakFreezes}</span>
          </div>
        )}
      </div>
      <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-surface-400">Level {level}</span>
        <span className="text-[10px] text-surface-400">Level {level + 1}</span>
      </div>
    </div>
  );
}
