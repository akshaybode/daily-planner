"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Task, Category, WeeklyReport as WeeklyReportType, HeatmapDay } from "@/lib/types";
import * as store from "@/lib/store";
import {
  formatDate,
  getWeekDates,
  getMonthDates,
  isToday,
  getDayName,
  getMonthName,
  cn,
} from "@/lib/utils";
import Sidebar, { ViewType } from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import TaskCard from "@/components/tasks/TaskCard";
import TaskModal from "@/components/tasks/TaskModal";
import Heatmap from "@/components/heatmap/Heatmap";
import WeeklyReportView from "@/components/reports/WeeklyReport";
import InsightsView from "@/components/reports/InsightsView";
import ShareProfileModal from "@/components/layout/ShareProfileModal";
import DailyQuote from "@/components/layout/DailyQuote";
import {
  Plus,
  Flame,
  Target,
  CheckCircle2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Sun,
  Moon,
  CloudSun,
} from "lucide-react";

function getGreeting(): { text: string; icon: React.ElementType } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: Sun };
  if (h < 17) return { text: "Good afternoon", icon: CloudSun };
  return { text: "Good evening", icon: Moon };
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthDate, setMonthDate] = useState(new Date());
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [reportWeekOffset, setReportWeekOffset] = useState(0);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [streak, setStreak] = useState(0);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Load tasks and categories
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [t, c] = await Promise.all([
        store.getTasks(user.id),
        store.getCategories(user.id),
      ]);
      setTasks(t);
      setCategories(c);
    };
    load();
  }, [user, refreshKey]);

  // Load streak
  useEffect(() => {
    if (!user) return;
    store.getStreak(user.id).then(setStreak);
  }, [user, refreshKey]);

  // Load heatmap data
  useEffect(() => {
    if (!user) return;
    store.getHeatmapData(user.id, heatmapYear).then(setHeatmapData);
  }, [user, heatmapYear, refreshKey]);

  // Load weekly report
  const reportWeekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + reportWeekOffset * 7);
    return d;
  }, [reportWeekOffset]);

  useEffect(() => {
    if (!user) return;
    store.getWeeklyReport(user.id, reportWeekStart).then(setWeeklyReport);
  }, [user, reportWeekStart, refreshKey]);

  const todayStr = formatDate(new Date());

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.date === selectedDate).sort((a, b) => a.sortOrder - b.sortOrder),
    [tasks, selectedDate]
  );

  const todayStats = useMemo(() => {
    const total = todayTasks.length;
    const completed = todayTasks.filter((t) => t.isCompleted).length;
    return { total, completed, rate: total > 0 ? completed / total : 0 };
  }, [todayTasks]);

  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(base);
  }, [weekOffset]);

  const monthDates = useMemo(
    () => getMonthDates(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate]
  );

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  // ─── Task CRUD (async) ───

  const handleCreateTask = async (data: Partial<Task>) => {
    if (!user) return;
    const task: Task = {
      id: "",
      userId: user.id,
      title: data.title || "",
      description: data.description || "",
      date: data.date || selectedDate,
      priority: data.priority || "medium",
      categoryId: data.categoryId || categories[0]?.id || "",
      isCompleted: false,
      completedAt: null,
      links: data.links || [],
      subTasks: data.subTasks || [],
      isRecurring: data.isRecurring || false,
      recurrenceDays: data.recurrenceDays || [],
      sortOrder: todayTasks.length,
      createdAt: new Date().toISOString(),
    };
    await store.addTask(task);
    refresh();
  };

  const handleUpdateTask = async (data: Partial<Task>) => {
    if (!editingTask) return;
    const updated = { ...editingTask, ...data };
    await store.updateTask(updated);
    setEditingTask(null);
    refresh();
  };

  const handleToggle = async (id: string) => {
    await store.toggleTaskComplete(id);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await store.deleteTask(id);
    refresh();
  };

  const handleToggleSubTask = async (taskId: string, subTaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const st = task.subTasks.find((s) => s.id === subTaskId);
    if (!st) return;
    await store.updateSubTask(taskId, subTaskId, !st.isCompleted);
    refresh();
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const greeting = getGreeting();

  const getTaskCountForDate = (date: Date) => {
    const dateStr = formatDate(date);
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const completed = dayTasks.filter((t) => t.isCompleted).length;
    return { total: dayTasks.length, completed };
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        onShareProfile={() => setIsShareModalOpen(true)}
      />

      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileSidebarOpen(true)} className="btn-ghost p-2 lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <greeting.icon className="w-5 h-5 text-amber-500" />
                  <h1 className="text-lg font-bold">
                    {greeting.text}, {user.name.split(" ")[0]}
                  </h1>
                </div>
                <p className="text-sm text-surface-500 mt-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            <button onClick={openCreateModal} className="btn-primary">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </header>

        <div className="px-4 lg:px-8 py-6">
          {/* ─── Dashboard View ─── */}
          {currentView === "dashboard" && (
            <div className="space-y-6 animate-in">
              <DailyQuote />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="flex items-center gap-2 text-surface-500 text-sm"><Target className="w-4 h-4" />Today&apos;s Tasks</div>
                  <p className="text-3xl font-bold mt-1">{todayStats.total}</p>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-2 text-surface-500 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Completed</div>
                  <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{todayStats.completed}</p>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-2 text-surface-500 text-sm"><TrendingUp className="w-4 h-4 text-brand-500" />Progress</div>
                  <div className="mt-2">
                    <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${todayStats.rate * 100}%` }} /></div>
                    <p className="text-sm font-bold mt-1 text-gradient">{Math.round(todayStats.rate * 100)}%</p>
                  </div>
                </div>
                <div className="stat-card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                  <div className="flex items-center gap-2 text-surface-500 text-sm"><Flame className="w-4 h-4 text-orange-500" />Streak</div>
                  <p className="text-3xl font-bold mt-1 text-orange-500">{streak}<span className="text-base font-normal text-surface-400 ml-1">days</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - 3 + i);
                  const dateStr = formatDate(d);
                  const isSel = dateStr === selectedDate;
                  const dayInfo = getTaskCountForDate(d);
                  return (
                    <button key={dateStr} onClick={() => setSelectedDate(dateStr)} className={cn("flex flex-col items-center min-w-[56px] px-3 py-3 rounded-xl transition-all", isSel ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25" : "hover:bg-surface-100 dark:hover:bg-surface-800")}>
                      <span className={cn("text-[10px] font-medium uppercase", !isSel && "text-surface-400")}>{getDayName(d)}</span>
                      <span className={cn("text-lg font-bold mt-0.5", !isSel && "text-surface-700 dark:text-surface-200")}>{d.getDate()}</span>
                      {dayInfo.total > 0 && (<div className="flex gap-0.5 mt-1"><div className={cn("w-1.5 h-1.5 rounded-full", dayInfo.completed === dayInfo.total ? isSel ? "bg-white" : "bg-emerald-500" : isSel ? "bg-white/50" : "bg-surface-300")} /></div>)}
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">
                    {selectedDate === todayStr ? "Today's Tasks" : `Tasks for ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                  </h2>
                  <span className="text-sm text-surface-400">{todayTasks.length} task{todayTasks.length !== 1 ? "s" : ""}</span>
                </div>
                {todayTasks.length === 0 ? (
                  <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8 text-brand-500" /></div>
                    <h3 className="text-lg font-bold mb-2">No tasks yet</h3>
                    <p className="text-surface-500 mb-6 max-w-sm mx-auto">Start planning your day by adding your first task. Stay focused and productive!</p>
                    <button onClick={openCreateModal} className="btn-primary"><Plus className="w-4 h-4" />Add First Task</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.map((task, i) => (
                      <div key={task.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-in">
                        <TaskCard task={task} category={getCategoryById(task.categoryId)} onToggle={handleToggle} onEdit={openEditModal} onDelete={handleDelete} onToggleSubTask={handleToggleSubTask} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Weekly View ─── */}
          {currentView === "weekly" && (
            <div className="space-y-6 animate-in">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Weekly View</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWeekOffset((w) => w - 1)} className="btn-ghost p-2"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => setWeekOffset(0)} className="btn-secondary text-sm px-3 py-1.5">This Week</button>
                  <button onClick={() => setWeekOffset((w) => w + 1)} className="btn-ghost p-2"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                {weekDates.map((d) => {
                  const dateStr = formatDate(d);
                  const dayTasks = tasks.filter((t) => t.date === dateStr).sort((a, b) => a.sortOrder - b.sortOrder);
                  const completed = dayTasks.filter((t) => t.isCompleted).length;
                  const isCurrentDay = isToday(d);
                  return (
                    <div key={dateStr} className={cn("glass-card p-4 flex flex-col", isCurrentDay && "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-surface-950")}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className={cn("text-xs font-medium uppercase", isCurrentDay ? "text-brand-500" : "text-surface-400")}>{getDayName(d)}</p>
                          <p className="text-lg font-bold">{d.getDate()}</p>
                        </div>
                        {dayTasks.length > 0 && (<div className={cn("text-xs font-semibold px-2 py-1 rounded-full", completed === dayTasks.length ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-surface-100 text-surface-500 dark:bg-surface-800")}>{completed}/{dayTasks.length}</div>)}
                      </div>
                      <div className="space-y-1.5 flex-1 min-h-[60px]">
                        {dayTasks.slice(0, 4).map((task) => (
                          <button key={task.id} onClick={() => { setSelectedDate(dateStr); setCurrentView("dashboard"); }} className={cn("w-full text-left text-xs p-2 rounded-lg transition-colors", task.isCompleted ? "bg-emerald-50 dark:bg-emerald-900/20 text-surface-400 line-through" : "bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-700/50")}>
                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryById(task.categoryId)?.color || "#94a3b8" }} /><span className="truncate">{task.title}</span></div>
                          </button>
                        ))}
                        {dayTasks.length > 4 && <p className="text-[10px] text-surface-400 pl-2">+{dayTasks.length - 4} more</p>}
                      </div>
                      <button onClick={() => { setSelectedDate(dateStr); openCreateModal(); }} className="mt-2 w-full py-1.5 border border-dashed border-surface-300 dark:border-surface-700 rounded-lg text-xs text-surface-400 hover:text-brand-500 hover:border-brand-400 transition-colors">+ Add</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Monthly View ─── */}
          {currentView === "monthly" && (
            <div className="space-y-6 animate-in">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{getMonthName(monthDate)} {monthDate.getFullYear()}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1))} className="btn-ghost p-2"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => setMonthDate(new Date())} className="btn-secondary text-sm px-3 py-1.5">Today</button>
                  <button onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1))} className="btn-ghost p-2"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="glass-card overflow-hidden">
                <div className="grid grid-cols-7 border-b border-surface-200 dark:border-surface-800">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (<div key={d} className="py-3 text-center text-xs font-semibold text-surface-400 uppercase">{d}</div>))}
                </div>
                <div className="grid grid-cols-7">
                  {monthDates.map((d, i) => {
                    if (!d) return <div key={`empty-${i}`} className="min-h-[100px] lg:min-h-[120px] border-b border-r border-surface-100 dark:border-surface-800/50" />;
                    const dateStr = formatDate(d);
                    const dayInfo = getTaskCountForDate(d);
                    const isCurrentDay = isToday(d);
                    const allDone = dayInfo.total > 0 && dayInfo.completed === dayInfo.total;
                    const dayTasks = tasks.filter((t) => t.date === dateStr);
                    return (
                      <button key={dateStr} onClick={() => { setSelectedDate(dateStr); setCurrentView("dashboard"); }} className={cn("min-h-[100px] lg:min-h-[120px] p-2 border-b border-r border-surface-100 dark:border-surface-800/50 text-left hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors", isCurrentDay && "bg-brand-50/50 dark:bg-brand-950/20")}>
                        <div className="flex items-center justify-between">
                          <span className={cn("w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium", isCurrentDay ? "bg-brand-500 text-white" : allDone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "")}>{d.getDate()}</span>
                          {dayInfo.total > 0 && <span className="text-[10px] text-surface-400">{dayInfo.completed}/{dayInfo.total}</span>}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {dayTasks.slice(0, 3).map((task) => (<div key={task.id} className={cn("text-[10px] lg:text-xs px-1.5 py-0.5 rounded truncate", task.isCompleted ? "text-surface-400 line-through" : "text-surface-600 dark:text-surface-400")} style={{ backgroundColor: (getCategoryById(task.categoryId)?.color || "#94a3b8") + "15" }}>{task.title}</div>))}
                          {dayTasks.length > 3 && <div className="text-[10px] text-surface-400 pl-1">+{dayTasks.length - 3} more</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── Reports View ─── */}
          {currentView === "report" && weeklyReport && (
            <WeeklyReportView report={weeklyReport} onPrevWeek={() => setReportWeekOffset((w) => w - 1)} onNextWeek={() => setReportWeekOffset((w) => w + 1)} canGoNext={reportWeekOffset < 0} />
          )}

          {/* ─── AI Insights View ─── */}
          {currentView === "insights" && user && <InsightsView userId={user.id} />}

          {/* ─── Heatmap View ─── */}
          {currentView === "heatmap" && (
            <div className="space-y-6 animate-in">
              <div><h2 className="text-2xl font-bold">Year in Review</h2><p className="text-surface-500 mt-1">Your task completion visualized like GitHub contributions</p></div>
              <Heatmap data={heatmapData} year={heatmapYear} onYearChange={setHeatmapYear} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card"><div className="text-sm text-surface-500">Total Tasks</div><p className="text-2xl font-bold">{heatmapData.reduce((s, d) => s + d.totalTasks, 0)}</p></div>
                <div className="stat-card"><div className="text-sm text-surface-500">Completed</div><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{heatmapData.reduce((s, d) => s + d.completedTasks, 0)}</p></div>
                <div className="stat-card"><div className="text-sm text-surface-500">Perfect Days</div><p className="text-2xl font-bold text-brand-500">{heatmapData.filter((d) => d.totalTasks > 0 && d.completedTasks === d.totalTasks).length}</p></div>
                <div className="stat-card"><div className="text-sm text-surface-500">Active Days</div><p className="text-2xl font-bold">{heatmapData.filter((d) => d.totalTasks > 0).length}</p></div>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      <TaskModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} onSave={editingTask ? handleUpdateTask : handleCreateTask} task={editingTask} categories={categories} defaultDate={selectedDate} />
      <ShareProfileModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
    </div>
  );
}
