"use client";

import React, { useEffect, useState } from "react";
import { TaskTemplate, Category } from "@/lib/types";
import * as store from "@/lib/store";
import { cn } from "@/lib/utils";
import { BookOpen, Plus, Trash2, ChevronRight, Sparkles, Dumbbell, Brain, Briefcase, Moon as MoonIcon, CalendarCheck } from "lucide-react";

const templateIcons: Record<string, React.ElementType> = {
  "Morning Routine": Sparkles,
  "Fitness Routine": Dumbbell,
  "Deep Work Sprint": Briefcase,
  "Learning Session": Brain,
  "Weekly Planning": CalendarCheck,
  "Evening Wind-Down": MoonIcon,
};

interface TemplateLibraryProps {
  userId: string;
  categories: Category[];
  onApplyTemplate: (template: TaskTemplate) => void;
}

export default function TemplateLibrary({ userId, categories, onApplyTemplate }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.getTemplates(userId).then((t) => { setTemplates(t); setLoading(false); });
  }, [userId]);

  const systemTemplates = templates.filter((t) => t.isSystem);
  const userTemplates = templates.filter((t) => !t.isSystem);

  const handleDelete = async (id: string) => {
    await store.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-6 h-6 text-brand-500" />
          <h2 className="text-2xl font-bold">Templates</h2>
        </div>
        <p className="text-surface-500">Quick-start your day with curated task bundles</p>
      </div>

      {systemTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-surface-500 uppercase tracking-wider mb-3">Built-in Templates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemTemplates.map((t) => {
              const Icon = templateIcons[t.name] || BookOpen;
              return (
                <button key={t.id} onClick={() => onApplyTemplate(t)} className="glass-card p-5 text-left hover:shadow-lg transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5 text-brand-500 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-surface-400">{t.templateTasks.length} tasks</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                  <p className="text-xs text-surface-500 line-clamp-2">{t.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {t.templateTasks.slice(0, 3).map((tt, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-surface-100 dark:bg-surface-800 rounded-full text-surface-500">{tt.title}</span>
                    ))}
                    {t.templateTasks.length > 3 && <span className="text-[10px] px-2 py-0.5 bg-surface-100 dark:bg-surface-800 rounded-full text-surface-400">+{t.templateTasks.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {userTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-surface-500 uppercase tracking-wider mb-3">My Templates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTemplates.map((t) => (
              <div key={t.id} className="glass-card p-5 group">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm">{t.name}</p>
                  <button onClick={() => handleDelete(t.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-surface-500 mb-3">{t.templateTasks.length} tasks</p>
                <button onClick={() => onApplyTemplate(t)} className="btn-primary w-full text-xs py-2">
                  <Plus className="w-3.5 h-3.5" /> Apply Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
