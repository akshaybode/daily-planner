"use client";

import React, { useState, useEffect } from "react";
import { InsightData, InsightPeriod, generateInsight } from "@/lib/insights";
import { cn } from "@/lib/utils";
import {
  Sparkles, Lock, Flame, Trophy, Crown, Zap, Star, Award,
  TrendingUp, TrendingDown, Minus, CheckCircle2, Target,
  CalendarCheck, ChevronRight, Brain,
} from "lucide-react";

const periodTabs: { id: InsightPeriod; label: string; shortLabel: string }[] = [
  { id: "weekly", label: "Weekly Summary", shortLabel: "Week" },
  { id: "monthly", label: "Monthly Reflection", shortLabel: "Month" },
  { id: "quarterly", label: "Quarterly Review", shortLabel: "Quarter" },
  { id: "yearly", label: "Year in Review", shortLabel: "Year" },
];

const achievementIcons: Record<string, React.ElementType> = {
  trophy: Trophy, flame: Flame, crown: Crown, zap: Zap, star: Star, badge: Award,
};

interface InsightsViewProps { userId: string }

export default function InsightsView({ userId }: InsightsViewProps) {
  const [activePeriod, setActivePeriod] = useState<InsightPeriod>("weekly");
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    generateInsight(userId, activePeriod).then((data) => {
      setInsight(data);
      setLoading(false);
    });
  }, [userId, activePeriod]);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-6 h-6 text-brand-500" />
          <h2 className="text-2xl font-bold">AI Insights</h2>
        </div>
        <p className="text-surface-500">Smart summaries and reflections generated from your productivity data</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {periodTabs.map((tab) => (
          <button key={tab.id} onClick={() => setActivePeriod(tab.id)} className={cn("px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all", activePeriod === tab.id ? "bg-brand-500 text-white shadow-lg" : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700")} style={activePeriod === tab.id ? { boxShadow: "0 8px 20px -4px rgb(124 58 237 / 0.35)" } : {}}>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {loading || !insight ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : !insight.isUnlocked ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-3xl flex items-center justify-center mx-auto mb-6"><Lock className="w-10 h-10 text-surface-300 dark:text-surface-600" /></div>
          <h3 className="text-xl font-bold mb-3">{insight.periodLabel} — Locked</h3>
          <p className="text-surface-500 max-w-md mx-auto mb-6 leading-relaxed">{insight.unlockMessage}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-950/30 rounded-full text-sm text-brand-600 dark:text-brand-400 font-medium"><Sparkles className="w-4 h-4" />Keep logging tasks to unlock AI-powered insights</div>
        </div>
      ) : (
        <>
          <div className="glass-card p-6 bg-gradient-to-r from-brand-50 to-violet-50 dark:from-brand-950/20 dark:to-violet-950/20 border-brand-100 dark:border-brand-900/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1"><Sparkles className="w-5 h-5 text-brand-500" /><h3 className="text-lg font-bold text-brand-700 dark:text-brand-300">{insight.periodLabel}</h3></div>
                <p className="text-sm text-brand-500/70 dark:text-brand-400/70">{insight.dateRange}</p>
              </div>
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", insight.trend === "up" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", insight.trend === "down" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", insight.trend === "stable" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}>
                {insight.trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
                {insight.trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
                {insight.trend === "stable" && <Minus className="w-3.5 h-3.5" />}
                {insight.trend === "up" ? "Improving" : insight.trend === "down" ? "Declining" : "Steady"}
              </div>
            </div>
            <div className="relative pl-4 border-l-2 border-brand-300 dark:border-brand-700"><p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300">{insight.summary}</p></div>
            <p className="text-xs text-surface-400 mt-4 italic">{insight.trendMessage}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="stat-card"><div className="flex items-center gap-2 text-surface-500 text-xs"><Target className="w-3.5 h-3.5" />Total Tasks</div><p className="text-2xl font-bold mt-1">{insight.totalTasks}</p></div>
            <div className="stat-card"><div className="flex items-center gap-2 text-surface-500 text-xs"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Completed</div><p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{insight.completedTasks}</p></div>
            <div className="stat-card"><div className="flex items-center gap-2 text-surface-500 text-xs"><Flame className="w-3.5 h-3.5 text-orange-500" />Current Streak</div><p className="text-2xl font-bold mt-1 text-orange-500">{insight.streakInfo.current}<span className="text-xs font-normal text-surface-400 ml-1">days</span></p></div>
            <div className="stat-card"><div className="flex items-center gap-2 text-surface-500 text-xs"><CalendarCheck className="w-3.5 h-3.5 text-brand-500" />Perfect Days</div><p className="text-2xl font-bold mt-1 text-brand-500">{insight.streakInfo.perfectDays}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />Achievements</h3>
              {insight.achievements.length === 0 ? (
                <div className="text-center py-6"><div className="w-12 h-12 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-3"><Star className="w-6 h-6 text-surface-300" /></div><p className="text-sm text-surface-400">Complete more tasks to unlock achievements!</p></div>
              ) : (
                <div className="space-y-3">
                  {insight.achievements.map((a, i) => {
                    const Icon = achievementIcons[a.icon] || Star;
                    return (
                      <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl", a.type === "milestone" && "bg-amber-50 dark:bg-amber-950/20", a.type === "streak" && "bg-orange-50 dark:bg-orange-950/20", a.type === "consistency" && "bg-brand-50 dark:bg-brand-950/20", a.type === "category" && "bg-emerald-50 dark:bg-emerald-950/20")}>
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", a.type === "milestone" && "bg-amber-100 dark:bg-amber-900/30", a.type === "streak" && "bg-orange-100 dark:bg-orange-900/30", a.type === "consistency" && "bg-brand-100 dark:bg-brand-900/30", a.type === "category" && "bg-emerald-100 dark:bg-emerald-900/30")}><Icon className={cn("w-4 h-4", a.type === "milestone" && "text-amber-600", a.type === "streak" && "text-orange-600", a.type === "consistency" && "text-brand-600", a.type === "category" && "text-emerald-600")} /></div>
                        <div><p className="text-sm font-semibold">{a.title}</p><p className="text-xs text-surface-500 mt-0.5">{a.description}</p></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-brand-500" />Key Highlights</h3>
                <div className="space-y-2">{insight.highlights.map((h, i) => (<div key={i} className="flex items-center gap-3 text-sm"><ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0" /><span>{h}</span></div>))}</div>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4">Category Breakdown</h3>
                {insight.topCategories.length === 0 ? (<p className="text-sm text-surface-400 text-center py-4">No category data yet</p>) : (
                  <div className="space-y-3">
                    {insight.topCategories.slice(0, 5).map((cat) => {
                      const pct = Math.round(cat.completionRate * 100);
                      return (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-sm font-medium">{cat.name}</span></div><span className="text-xs text-surface-400">{cat.count} tasks &middot; {pct}%</span></div>
                          <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cat.color }} /></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-100 dark:border-orange-900/30">
            <div className="flex items-center gap-4 flex-1"><div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center"><Flame className="w-7 h-7 text-orange-500" /></div><div><p className="text-sm text-surface-500">Current Streak</p><p className="text-3xl font-bold text-orange-500">{insight.streakInfo.current} days</p></div></div>
            <div className="w-px h-12 bg-orange-200 dark:bg-orange-800 hidden sm:block" />
            <div className="flex items-center gap-4 flex-1"><div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center"><Trophy className="w-7 h-7 text-amber-500" /></div><div><p className="text-sm text-surface-500">Longest Streak</p><p className="text-3xl font-bold text-amber-500">{insight.streakInfo.longest} days</p></div></div>
            <div className="w-px h-12 bg-orange-200 dark:bg-orange-800 hidden sm:block" />
            <div className="flex items-center gap-4 flex-1"><div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center"><Crown className="w-7 h-7 text-emerald-500" /></div><div><p className="text-sm text-surface-500">Completion Rate</p><p className="text-3xl font-bold text-emerald-500">{Math.round(insight.completionRate * 100)}%</p></div></div>
          </div>

          <div className="text-center text-xs text-surface-400 flex items-center justify-center gap-2"><Sparkles className="w-3.5 h-3.5" />AI-generated summary based on your productivity data</div>
        </>
      )}
    </div>
  );
}
