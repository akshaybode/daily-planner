"use client";

import React from "react";
import { WeeklyReport as WeeklyReportType } from "@/lib/types";
import {
  CheckCircle2,
  Target,
  Flame,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyReportProps {
  report: WeeklyReportType;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  canGoNext: boolean;
}

export default function WeeklyReportView({
  report,
  onPrevWeek,
  onNextWeek,
  canGoNext,
}: WeeklyReportProps) {
  const completionPct = Math.round(report.completionRate * 100);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weekly Report</h2>
          <p className="text-surface-500 mt-1">
            {new Date(report.weekStart).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            &mdash;{" "}
            {new Date(report.weekEnd).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPrevWeek} className="btn-ghost p-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNextWeek}
            disabled={!canGoNext}
            className="btn-ghost p-2 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <Target className="w-4 h-4" />
            Total Tasks
          </div>
          <p className="text-3xl font-bold mt-1">{report.totalTasks}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Completed
          </div>
          <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {report.completedTasks}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            Completion
          </div>
          <p className="text-3xl font-bold mt-1 text-gradient">{completionPct}%</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            Perfect Days
          </div>
          <p className="text-3xl font-bold mt-1 text-orange-500">
            {report.streakDays}/7
          </p>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4">Daily Breakdown</h3>
        <div className="space-y-3">
          {report.dailyBreakdown.map((day) => {
            const pct = day.total > 0 ? (day.completed / day.total) * 100 : 0;
            const isPerfect = day.total > 0 && day.completed === day.total;
            return (
              <div key={day.date} className="flex items-center gap-4">
                <span className="text-sm font-medium w-10 text-surface-500">
                  {day.day}
                </span>
                <div className="flex-1">
                  <div className="progress-bar">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        isPerfect
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          : pct > 0
                          ? "bg-gradient-to-r from-brand-500 to-brand-400"
                          : ""
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {day.completed}/{day.total}
                </span>
                {isPerfect && (
                  <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category & Priority split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">By Category</h3>
          {report.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-surface-400">No tasks this week</p>
          ) : (
            <div className="space-y-3">
              {report.categoryBreakdown.map((cat) => {
                const pct = cat.count > 0 ? (cat.completed / cat.count) * 100 : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium">{cat.category}</span>
                      </div>
                      <span className="text-sm text-surface-500">
                        {cat.completed}/{cat.count}
                      </span>
                    </div>
                    <div className="progress-bar h-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">By Priority</h3>
          <div className="space-y-4">
            {[
              { label: "High", value: report.topPriority.high, color: "bg-red-500", textColor: "text-red-500" },
              { label: "Medium", value: report.topPriority.medium, color: "bg-amber-500", textColor: "text-amber-500" },
              { label: "Low", value: report.topPriority.low, color: "bg-emerald-500", textColor: "text-emerald-500" },
            ].map((p) => {
              const total = report.totalTasks || 1;
              return (
                <div key={p.label} className="flex items-center gap-4">
                  <span className={cn("text-sm font-semibold w-16", p.textColor)}>
                    {p.label}
                  </span>
                  <div className="flex-1 progress-bar">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", p.color)}
                      style={{ width: `${(p.value / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {p.value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Motivational message */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-brand-100/50 dark:from-brand-950/30 dark:to-brand-900/20 border border-brand-200/50 dark:border-brand-800/30">
            <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
              {completionPct >= 90
                ? "Outstanding work this week! Keep up the momentum!"
                : completionPct >= 70
                ? "Great progress! Push a little harder next week."
                : completionPct >= 50
                ? "Halfway there! Stay consistent and you'll improve."
                : report.totalTasks === 0
                ? "No tasks planned this week. Time to set some goals!"
                : "Tough week? Every step counts. Try again tomorrow!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
