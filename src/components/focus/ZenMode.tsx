"use client";

import React, { useState, useEffect } from "react";
import { Task, Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X, Check, Circle, Sparkles, Timer, ChevronRight } from "lucide-react";

interface ZenModeProps {
  tasks: Task[];
  categories: Category[];
  onToggleTask: (id: string) => void;
  onClose: () => void;
}

export default function ZenMode({ tasks, categories, onToggleTask, onClose }: ZenModeProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const incomplete = tasks.filter((t) => !t.isCompleted);
  const completed = tasks.filter((t) => t.isCompleted);
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed.length / total) * 100) : 0;
  const getCat = (id: string) => categories.find((c) => c.id === id);

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-surface-950 flex flex-col">
      <header className="flex items-center justify-between px-6 lg:px-12 py-5 border-b border-surface-100 dark:border-surface-800/50">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-brand-500" />
          <span className="font-semibold text-surface-400">Zen Mode</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-surface-400 tabular-nums">{time}</span>
          <span className="text-sm font-bold text-brand-500">{pct}%</span>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-8">
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-surface-400 mb-6">
            {incomplete.length > 0
              ? `${incomplete.length} task${incomplete.length !== 1 ? "s" : ""} remaining`
              : "All tasks completed! Great job."}
          </p>

          <div className="h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>

          {incomplete.length > 0 && (
            <div className="space-y-3 mb-10">
              {incomplete.map((task) => {
                const cat = getCat(task.categoryId);
                return (
                  <button key={task.id} onClick={() => onToggleTask(task.id)} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group text-left">
                    <div className="w-6 h-6 rounded-full border-2 border-surface-300 dark:border-surface-600 flex items-center justify-center flex-shrink-0 group-hover:border-brand-500 transition-colors">
                      <Circle className="w-3 h-3 text-transparent group-hover:text-brand-500 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{task.title}</p>
                      {cat && <p className="text-xs text-surface-400 mt-0.5">{cat.name}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-surface-400">
                      {task.difficulty === 3 && <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-500 rounded text-[10px] font-bold">HARD</span>}
                      {task.difficulty === 2 && <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-500 rounded text-[10px] font-bold">MED</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Completed</p>
              <div className="space-y-1">
                {completed.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl opacity-50">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-sm line-through text-surface-400">{task.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
