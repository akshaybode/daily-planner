"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { PublicProfileData, HeatmapDay } from "@/lib/types";
import * as store from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Flame,
  Trophy,
  Target,
  CheckCircle2,
  CalendarCheck,
  Zap,
  Sparkles,
  ArrowLeft,
  TrendingUp,
  Crown,
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

const levelColors = [
  "bg-surface-100 dark:bg-surface-800",
  "bg-emerald-200 dark:bg-emerald-900",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-500 dark:bg-emerald-500",
  "bg-emerald-700 dark:bg-emerald-400",
];

function ProfileHeatmap({ data }: { data: HeatmapDay[] }) {
  const [tooltip, setTooltip] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);
  const year = new Date().getFullYear();

  const weeks = useMemo(() => {
    const result: (HeatmapDay | null)[][] = [];
    let currentWeek: (HeatmapDay | null)[] = [];
    const firstDay = new Date(year, 0, 1);
    const padding = firstDay.getDay();
    for (let i = 0; i < padding; i++) currentWeek.push(null);
    for (const day of data) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      result.push(currentWeek);
    }
    return result;
  }, [data, year]);

  const monthLabels = useMemo(() => {
    const labels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      for (const day of week) {
        if (day) {
          const m = new Date(day.date).getMonth();
          if (m !== lastMonth) {
            labels.push({ month: MONTHS[m], col: i });
            lastMonth = m;
          }
          break;
        }
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-0.5 min-w-fit">
          <div className="flex gap-0.5 ml-8 mb-1">
            {monthLabels.map(({ month, col }, i) => (
              <div
                key={i}
                className="text-[10px] text-surface-400 font-medium"
                style={{
                  position: "relative",
                  left: `${col * 14}px`,
                  marginRight: i < monthLabels.length - 1
                    ? `${((monthLabels[i + 1]?.col ?? 0) - col) * 14 - 28}px`
                    : 0,
                }}
              >
                {month}
              </div>
            ))}
          </div>
          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5 mr-1">
              {DAYS.map((day, i) => (
                <div key={i} className="w-6 h-[12px] text-[10px] text-surface-400 flex items-center justify-end pr-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => (
                    <div
                      key={`${wi}-${di}`}
                      className={cn(
                        "w-[12px] h-[12px] rounded-[2px] transition-all duration-200",
                        day
                          ? `${levelColors[day.count]} hover:ring-2 hover:ring-brand-400 hover:ring-offset-1 dark:hover:ring-offset-surface-900 cursor-pointer`
                          : "bg-transparent"
                      )}
                      onMouseEnter={(e) => {
                        if (day) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({ day, x: rect.left, y: rect.top });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 ml-8">
            <span className="text-[10px] text-surface-400">Less</span>
            {levelColors.map((color, i) => (
              <div key={i} className={cn("w-[12px] h-[12px] rounded-[2px]", color)} />
            ))}
            <span className="text-[10px] text-surface-400">More</span>
          </div>
        </div>
      </div>
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-xs rounded-lg shadow-xl pointer-events-none"
          style={{ left: tooltip.x - 40, top: tooltip.y - 45 }}
        >
          <div className="font-semibold">
            {tooltip.day.completedTasks}/{tooltip.day.totalTasks} tasks
          </div>
          <div className="text-surface-400 dark:text-surface-500">
            {new Date(tooltip.day.date).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Last30DaysChart({ data }: { data: { date: string; total: number; completed: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex items-end gap-[3px] h-24">
      {data.map((day) => {
        const totalH = day.total > 0 ? (day.total / maxVal) * 100 : 0;
        const completedH = day.total > 0 ? (day.completed / maxVal) * 100 : 0;
        const isPerfect = day.total > 0 && day.completed === day.total;

        return (
          <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div className="w-full max-w-[10px] flex flex-col justify-end h-full relative">
              <div
                className="w-full bg-surface-200 dark:bg-surface-700 rounded-t-sm absolute bottom-0"
                style={{ height: `${totalH}%` }}
              />
              <div
                className={cn(
                  "w-full rounded-t-sm absolute bottom-0 transition-all",
                  isPerfect
                    ? "bg-emerald-500"
                    : "bg-brand-500"
                )}
                style={{ height: `${completedH}%` }}
              />
            </div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 px-2 py-1 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-[10px] rounded whitespace-nowrap">
              {day.completed}/{day.total} &middot;{" "}
              {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    store.getPublicProfileData(slug).then((data) => {
      if (data) {
        setProfile(data);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-surface-300" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Profile Not Found</h1>
          <p className="text-surface-500 mb-8">
            This profile doesn&apos;t exist or the user has made it private.
          </p>
          <a href="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go to PlanFlow
          </a>
        </div>
      </div>
    );
  }

  const completionRate =
    profile.totalTasksAllTime > 0
      ? Math.round((profile.completedTasksAllTime / profile.totalTasksAllTime) * 100)
      : 0;

  const memberSinceStr = new Date(profile.user.memberSince).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Hero header with gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-20 sm:pt-12 sm:pb-24">
          {/* Branding */}
          <a href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 sm:mb-12 text-sm">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">PlanFlow</span>
          </a>

          {/* Profile info */}
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-3xl sm:text-4xl flex-shrink-0 ring-4 ring-white/10">
              {profile.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-white">
              <h1 className="text-3xl sm:text-4xl font-extrabold">{profile.user.name}</h1>
              {profile.user.bio && (
                <p className="text-lg text-brand-100 mt-2 max-w-lg">{profile.user.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-brand-200">
                <span className="flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4" />
                  Member since {memberSinceStr}
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-300" />
                  {profile.currentStreak} day streak
                </span>
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-300" />
                  {profile.longestStreak} best streak
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content overlapping the hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-14 relative z-20 pb-16">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            {
              label: "Current Streak",
              value: `${profile.currentStreak}`,
              suffix: "days",
              icon: Flame,
              iconColor: "text-orange-500",
              bg: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
            },
            {
              label: "Tasks Completed",
              value: `${profile.completedTasksAllTime}`,
              suffix: `/ ${profile.totalTasksAllTime}`,
              icon: CheckCircle2,
              iconColor: "text-emerald-500",
              bg: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
            },
            {
              label: "Completion Rate",
              value: `${completionRate}%`,
              suffix: "",
              icon: TrendingUp,
              iconColor: "text-brand-500",
              bg: "bg-gradient-to-br from-brand-50 to-violet-50 dark:from-brand-950/30 dark:to-violet-950/30",
            },
            {
              label: "Perfect Days",
              value: `${profile.perfectDays}`,
              suffix: `of ${profile.activeDays} active`,
              icon: Crown,
              iconColor: "text-amber-500",
              bg: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30",
            },
          ].map((stat) => (
            <div key={stat.label} className={cn("rounded-2xl p-4 sm:p-5 border border-white/60 dark:border-surface-800 shadow-lg shadow-surface-900/5", stat.bg)}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn("w-4 h-4", stat.iconColor)} />
                <span className="text-xs sm:text-sm font-medium text-surface-500">{stat.label}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">
                {stat.value}
                {stat.suffix && (
                  <span className="text-sm font-normal text-surface-400 ml-1">{stat.suffix}</span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="glass-card p-5 sm:p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Activity Heatmap</h2>
              <p className="text-sm text-surface-500 mt-0.5">
                {new Date().getFullYear()} task completion overview
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-surface-500">
                {profile.perfectDays} perfect days
              </span>
            </div>
          </div>
          <ProfileHeatmap data={profile.heatmapData} />
        </div>

        {/* Last 30 days + Categories side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Last 30 Days */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="text-lg font-bold mb-1">Last 30 Days</h3>
            <p className="text-sm text-surface-500 mb-5">Daily task completion</p>
            <Last30DaysChart data={profile.last30Days} />
            <div className="flex items-center justify-between mt-3 text-[10px] text-surface-400">
              <span>30 days ago</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-brand-500 inline-block" /> Completed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-surface-200 dark:bg-surface-700 inline-block" /> Total
                </span>
              </div>
              <span>Today</span>
            </div>
          </div>

          {/* Categories */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="text-lg font-bold mb-1">Top Categories</h3>
            <p className="text-sm text-surface-500 mb-5">Where the effort goes</p>
            {profile.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-surface-400 py-8 text-center">No tasks yet</p>
            ) : (
              <div className="space-y-4">
                {profile.categoryBreakdown.slice(0, 6).map((cat) => {
                  const pct = cat.count > 0 ? (cat.completed / cat.count) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <span className="text-sm text-surface-500">
                          {cat.completed}/{cat.count}
                          <span className="text-surface-400 ml-1">({Math.round(pct)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-full text-sm text-surface-500">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Powered by</span>
            <a href="/" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
              PlanFlow
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
