"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Task, Category, WeeklyReport as WeeklyReportType, HeatmapDay, TaskTemplate } from "@/lib/types";
import * as store from "@/lib/store";
import {
  formatDate, getWeekDates, getMonthDates, isToday, getDayName, getMonthName, cn,
} from "@/lib/utils";
import Sidebar, { ViewType } from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import TaskCard from "@/components/tasks/TaskCard";
import TaskModal from "@/components/tasks/TaskModal";
import Heatmap from "@/components/heatmap/Heatmap";
import WeeklyReportView from "@/components/reports/WeeklyReport";
import InsightsView from "@/components/reports/InsightsView";
import ShareProfileModal from "@/components/layout/ShareProfileModal";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import DailyQuote from "@/components/layout/DailyQuote";
import XpBar from "@/components/gamification/XpBar";
import AchievementBadges from "@/components/gamification/AchievementBadges";
import PomodoroTimer from "@/components/pomodoro/PomodoroTimer";
import ZenMode from "@/components/focus/ZenMode";
import RadarChart from "@/components/charts/RadarChart";
import TemplateLibrary from "@/components/templates/TemplateLibrary";
import {
  Plus, Flame, Target, CheckCircle2, TrendingUp, ChevronLeft, ChevronRight,
  Menu, Sparkles, Sun, Moon, CloudSun, Zap, Shield,
} from "lucide-react";

function getGreeting(): { text: string; icon: React.ElementType } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: Sun };
  if (h < 17) return { text: "Good afternoon", icon: CloudSun };
  return { text: "Good evening", icon: Moon };
}

export default function DashboardPage() {
  const { user, isLoading, refreshUser } = useAuth();
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
  const [isZenMode, setIsZenMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [xpToast, setXpToast] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [t, c] = await Promise.all([store.getTasks(user.id), store.getCategories(user.id)]);
      setTasks(t); setCategories(c);
    };
    load();
  }, [user, refreshKey]);

  useEffect(() => {
    if (!user) return;
    store.getStreak(user.id).then(setStreak);
  }, [user, refreshKey]);

  useEffect(() => {
    if (!user) return;
    store.getHeatmapData(user.id, heatmapYear).then(setHeatmapData);
  }, [user, heatmapYear, refreshKey]);

  const reportWeekStart = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + reportWeekOffset * 7); return d;
  }, [reportWeekOffset]);

  useEffect(() => {
    if (!user) return;
    store.getWeeklyReport(user.id, reportWeekStart).then(setWeeklyReport);
  }, [user, reportWeekStart, refreshKey]);

  const todayStr = formatDate(new Date());
  const todayTasks = useMemo(() => tasks.filter((t) => t.date === selectedDate).sort((a, b) => a.sortOrder - b.sortOrder), [tasks, selectedDate]);
  const todayStats = useMemo(() => {
    const total = todayTasks.length;
    const completed = todayTasks.filter((t) => t.isCompleted).length;
    return { total, completed, rate: total > 0 ? completed / total : 0 };
  }, [todayTasks]);

  const weekDates = useMemo(() => { const b = new Date(); b.setDate(b.getDate() + weekOffset * 7); return getWeekDates(b); }, [weekOffset]);
  const monthDates = useMemo(() => getMonthDates(monthDate.getFullYear(), monthDate.getMonth()), [monthDate]);
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  const showXpToast = (amount: number) => {
    setXpToast({ amount, visible: true });
    setTimeout(() => setXpToast((p) => ({ ...p, visible: false })), 2000);
  };

  const handleCreateTask = async (data: Partial<Task>) => {
    if (!user) return;
    const task: Task = {
      id: "", userId: user.id, title: data.title || "", description: data.description || "",
      date: data.date || selectedDate, priority: data.priority || "medium",
      difficulty: data.difficulty || 1, categoryId: data.categoryId || categories[0]?.id || "",
      isCompleted: false, completedAt: null, estimatedMinutes: data.estimatedMinutes || 30,
      actualMinutes: 0, links: data.links || [], subTasks: data.subTasks || [],
      isRecurring: data.isRecurring || false, recurrenceDays: data.recurrenceDays || [],
      sortOrder: todayTasks.length, createdAt: new Date().toISOString(),
    };
    await store.addTask(task);
    refresh();
  };

  const handleUpdateTask = async (data: Partial<Task>) => {
    if (!editingTask) return;
    await store.updateTask({ ...editingTask, ...data });
    setEditingTask(null);
    refresh();
  };

  const handleToggle = async (id: string) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === id);
    const wasCompleted = task?.isCompleted;
    await store.toggleTaskComplete(id, user.id);
    if (task && !wasCompleted) {
      const xpAmount = { 1: 10, 2: 25, 3: 50 }[task.difficulty] || 10;
      showXpToast(xpAmount);
      store.checkAndUnlockAchievements(user.id);
    }
    refresh();
  };

  const handleDelete = async (id: string) => { await store.deleteTask(id); refresh(); };

  const handleToggleSubTask = async (taskId: string, subTaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const st = task?.subTasks.find((s) => s.id === subTaskId);
    if (!st) return;
    await store.updateSubTask(taskId, subTaskId, !st.isCompleted);
    refresh();
  };

  const handleApplyTemplate = async (template: TaskTemplate) => {
    if (!user) return;
    for (const tt of template.templateTasks) {
      const matchedCat = categories.find((c) => c.name.toLowerCase() === tt.categoryHint.toLowerCase());
      const task: Task = {
        id: "", userId: user.id, title: tt.title, description: "",
        date: selectedDate, priority: tt.priority, difficulty: tt.difficulty,
        categoryId: matchedCat?.id || categories[0]?.id || "",
        isCompleted: false, completedAt: null, estimatedMinutes: tt.estimatedMinutes,
        actualMinutes: 0, links: [], subTasks: [],
        isRecurring: false, recurrenceDays: [],
        sortOrder: 0, createdAt: new Date().toISOString(),
      };
      await store.addTask(task);
    }
    refresh();
    setCurrentView("dashboard");
  };

  const openEditModal = (task: Task) => { setEditingTask(task); setIsModalOpen(true); };
  const openCreateModal = () => { setEditingTask(null); setIsModalOpen(true); };

  if (isLoading || !user) {
    return (<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>);
  }

  if (isZenMode) {
    return (<ZenMode tasks={todayTasks} categories={categories} onToggleTask={handleToggle} onClose={() => setIsZenMode(false)} />);
  }

  const greeting = getGreeting();
  const getTaskCountForDate = (date: Date) => {
    const dateStr = formatDate(date);
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    return { total: dayTasks.length, completed: dayTasks.filter((t) => t.isCompleted).length };
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView}
        isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)}
        onShareProfile={() => setIsShareModalOpen(true)} onZenMode={() => setIsZenMode(true)}
        onChangePassword={() => setIsChangePasswordOpen(true)} />

      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileSidebarOpen(true)} className="btn-ghost p-2 lg:hidden"><Menu className="w-5 h-5" /></button>
              <div>
                <div className="flex items-center gap-2">
                  <greeting.icon className="w-5 h-5 text-amber-500" />
                  <h1 className="text-lg font-bold">{greeting.text}, {user.name.split(" ")[0]}</h1>
                </div>
                <p className="text-sm text-surface-500 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Lv.{user.level}</span>
                <span className="text-xs text-amber-500/70">{user.xp} XP</span>
              </div>
              <button onClick={openCreateModal} className="btn-primary"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Task</span></button>
            </div>
          </div>
        </header>

        {/* XP Toast */}
        {xpToast.visible && (
          <div className="fixed top-20 right-6 z-50 animate-in">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl shadow-xl shadow-amber-500/25">
              <Zap className="w-4 h-4" />
              <span className="font-bold">+{xpToast.amount} XP</span>
            </div>
          </div>
        )}

        <div className="px-4 lg:px-8 py-6">
          {/* ─── Dashboard ─── */}
          {currentView === "dashboard" && (
            <div className="space-y-6 animate-in">
              <DailyQuote />
              <XpBar xp={user.xp} level={user.level} streakFreezes={user.streakFreezes} />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card"><div className="flex items-center gap-2 text-surface-500 text-sm"><Target className="w-4 h-4" />Today&apos;s Tasks</div><p className="text-3xl font-bold mt-1">{todayStats.total}</p></div>
                <div className="stat-card"><div className="flex items-center gap-2 text-surface-500 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Completed</div><p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{todayStats.completed}</p></div>
                <div className="stat-card"><div className="flex items-center gap-2 text-surface-500 text-sm"><TrendingUp className="w-4 h-4 text-brand-500" />Progress</div><div className="mt-2"><div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${todayStats.rate * 100}%` }} /></div><p className="text-sm font-bold mt-1 text-gradient">{Math.round(todayStats.rate * 100)}%</p></div></div>
                <div className="stat-card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-surface-500 text-sm"><Flame className="w-4 h-4 text-orange-500" />Streak</div>
                    {user.streakFreezes > 0 && <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500" /><span className="text-[10px] font-bold text-blue-500">{user.streakFreezes}</span></div>}
                  </div>
                  <p className="text-3xl font-bold mt-1 text-orange-500">{streak}<span className="text-base font-normal text-surface-400 ml-1">days</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - 3 + i);
                  const dateStr = formatDate(d); const isSel = dateStr === selectedDate;
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
                  <h2 className="text-lg font-bold">{selectedDate === todayStr ? "Today's Tasks" : `Tasks for ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}</h2>
                  <span className="text-sm text-surface-400">{todayTasks.length} task{todayTasks.length !== 1 ? "s" : ""}</span>
                </div>
                {todayTasks.length === 0 ? (
                  <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8 text-brand-500" /></div>
                    <h3 className="text-lg font-bold mb-2">No tasks yet</h3>
                    <p className="text-surface-500 mb-6 max-w-sm mx-auto">Start planning your day by adding tasks or using a template.</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={openCreateModal} className="btn-primary"><Plus className="w-4 h-4" />Add Task</button>
                      <button onClick={() => setCurrentView("templates")} className="btn-secondary">Use Template</button>
                    </div>
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
                        <div><p className={cn("text-xs font-medium uppercase", isCurrentDay ? "text-brand-500" : "text-surface-400")}>{getDayName(d)}</p><p className="text-lg font-bold">{d.getDate()}</p></div>
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
                    const dateStr = formatDate(d); const dayInfo = getTaskCountForDate(d);
                    const isCurrentDay = isToday(d); const allDone = dayInfo.total > 0 && dayInfo.completed === dayInfo.total;
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

          {/* ─── Pomodoro ─── */}
          {currentView === "pomodoro" && (
            <PomodoroTimer userId={user.id} tasks={todayTasks} onComplete={refresh} />
          )}

          {/* ─── Reports ─── */}
          {currentView === "report" && weeklyReport && (
            <div className="space-y-6 animate-in">
              <WeeklyReportView report={weeklyReport} onPrevWeek={() => setReportWeekOffset((w) => w - 1)} onNextWeek={() => setReportWeekOffset((w) => w + 1)} canGoNext={reportWeekOffset < 0} />
              {weeklyReport.radar && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold mb-4">Productivity Radar</h3>
                  <div className="flex justify-center">
                    <RadarChart data={weeklyReport.radar} />
                  </div>
                </div>
              )}
              <div className="glass-card p-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-sm"><strong>{weeklyReport.xpEarned} XP</strong> earned this week</span>
              </div>
            </div>
          )}

          {/* ─── AI Insights ─── */}
          {currentView === "insights" && <InsightsView userId={user.id} />}

          {/* ─── Achievements ─── */}
          {currentView === "achievements" && <AchievementBadges userId={user.id} />}

          {/* ─── Templates ─── */}
          {currentView === "templates" && (
            <TemplateLibrary userId={user.id} categories={categories} onApplyTemplate={handleApplyTemplate} />
          )}

          {/* ─── Heatmap ─── */}
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
      <ChangePasswordModal open={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </div>
  );
}
