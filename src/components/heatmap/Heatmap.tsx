"use client";

import React, { useMemo, useState } from "react";
import { HeatmapDay } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HeatmapProps {
  data: HeatmapDay[];
  year: number;
  onYearChange: (year: number) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

const levelColors = [
  "bg-surface-100 dark:bg-surface-800",
  "bg-emerald-200 dark:bg-emerald-900",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-500 dark:bg-emerald-500",
  "bg-emerald-700 dark:bg-emerald-400",
];

export default function Heatmap({ data, year, onYearChange }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);

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

  const totalCompleted = data.reduce((sum, d) => sum + d.completedTasks, 0);
  const totalTasks = data.reduce((sum, d) => sum + d.totalTasks, 0);
  const daysWithAllComplete = data.filter(
    (d) => d.totalTasks > 0 && d.completedTasks === d.totalTasks
  ).length;

  const currentYear = new Date().getFullYear();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Activity Heatmap</h2>
          <p className="text-sm text-surface-500 mt-1">
            {totalCompleted} tasks completed &middot; {daysWithAllComplete} perfect days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYearChange(year - 1)}
            className="btn-ghost text-sm px-3 py-1.5"
          >
            {year - 1}
          </button>
          <span className="text-sm font-bold px-3 py-1.5 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-lg">
            {year}
          </span>
          {year < currentYear && (
            <button
              onClick={() => onYearChange(year + 1)}
              className="btn-ghost text-sm px-3 py-1.5"
            >
              {year + 1}
            </button>
          )}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-0.5 min-w-fit">
          {/* Month labels */}
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
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAYS.map((day, i) => (
                <div
                  key={i}
                  className="w-6 h-[12px] text-[10px] text-surface-400 flex items-center justify-end pr-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid */}
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

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 ml-8">
            <span className="text-[10px] text-surface-400">Less</span>
            {levelColors.map((color, i) => (
              <div key={i} className={cn("w-[12px] h-[12px] rounded-[2px]", color)} />
            ))}
            <span className="text-[10px] text-surface-400">More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-xs rounded-lg shadow-xl pointer-events-none animate-scale-in"
          style={{
            left: tooltip.x - 40,
            top: tooltip.y - 45,
          }}
        >
          <div className="font-semibold">
            {tooltip.day.completedTasks}/{tooltip.day.totalTasks} tasks
          </div>
          <div className="text-surface-400 dark:text-surface-500">
            {new Date(tooltip.day.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      )}
    </div>
  );
}
