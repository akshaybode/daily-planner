"use client";

import React, { useState, useEffect } from "react";
import { Task, Category, TaskLink, SubTask, Priority, Difficulty } from "@/lib/types";
import { generateId, detectLinkType, getLinkColor } from "@/lib/utils";
import {
  X,
  Plus,
  Trash2,
  Link as LinkIcon,
  Play,
  FileText,
  Github,
  MessageSquare,
  Table,
  ExternalLink,
  GripVertical,
  AlertCircle,
} from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task | null;
  categories: Category[];
  defaultDate: string;
}

const linkIcons: Record<string, React.ElementType> = {
  youtube: Play,
  notion: FileText,
  google_docs: FileText,
  google_sheets: Table,
  github: Github,
  stackoverflow: MessageSquare,
  figma: FileText,
  generic: LinkIcon,
};

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  categories,
  defaultDate,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [priority, setPriority] = useState<Priority>("medium");
  const [categoryId, setCategoryId] = useState("");
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newSubTask, setNewSubTask] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDate(task.date);
      setPriority(task.priority);
      setCategoryId(task.categoryId);
      setLinks(task.links);
      setSubTasks(task.subTasks);
      setDifficulty(task.difficulty ?? 1);
      setEstimatedMinutes(task.estimatedMinutes ?? 30);
      setIsRecurring(task.isRecurring);
      setRecurrenceDays(task.recurrenceDays);
    } else {
      setTitle("");
      setDescription("");
      setDate(defaultDate);
      setPriority("medium");
      setCategoryId(categories[0]?.id || "");
      setLinks([]);
      setSubTasks([]);
      setDifficulty(1);
      setEstimatedMinutes(30);
      setIsRecurring(false);
      setRecurrenceDays([]);
    }
    setShowLinkInput(false);
    setNewLinkUrl("");
    setNewLinkTitle("");
    setNewSubTask("");
  }, [task, isOpen, defaultDate, categories]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      priority,
      difficulty,
      estimatedMinutes,
      categoryId,
      links,
      subTasks,
      isRecurring,
      recurrenceDays,
    });
    onClose();
  };

  const addLink = () => {
    if (!newLinkUrl.trim()) return;
    const linkType = detectLinkType(newLinkUrl);
    const link: TaskLink = {
      id: generateId(),
      url: newLinkUrl.trim(),
      title: newLinkTitle.trim() || new URL(newLinkUrl.trim()).hostname,
      linkType,
    };
    setLinks([...links, link]);
    setNewLinkUrl("");
    setNewLinkTitle("");
    setShowLinkInput(false);
  };

  const removeLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  const addSubTask = () => {
    if (!newSubTask.trim()) return;
    setSubTasks([
      ...subTasks,
      { id: generateId(), title: newSubTask.trim(), isCompleted: false },
    ]);
    setNewSubTask("");
  };

  const removeSubTask = (id: string) => {
    setSubTasks(subTasks.filter((s) => s.id !== id));
  };

  const toggleDay = (day: string) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (!isOpen) return null;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white dark:bg-surface-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2 -mr-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-lg font-medium"
              placeholder="Task title..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              placeholder="Add a note..."
              rows={2}
            />
          </div>

          {/* Date & Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">
                Priority
              </label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      priority === p
                        ? p === "high"
                          ? "bg-red-500 text-white shadow-md"
                          : p === "medium"
                          ? "bg-amber-500 text-white shadow-md"
                          : "bg-emerald-500 text-white shadow-md"
                        : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty & Time estimate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">
                Difficulty
              </label>
              <div className="flex gap-1.5">
                {([1, 2, 3] as Difficulty[]).map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      difficulty === d
                        ? d === 3 ? "bg-red-500 text-white shadow-md" : d === 2 ? "bg-amber-500 text-white shadow-md" : "bg-emerald-500 text-white shadow-md"
                        : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
                    }`}>
                    {d === 1 ? "Easy" : d === 2 ? "Medium" : "Hard"}
                    <span className="block text-[10px] opacity-70">{d === 1 ? "10 XP" : d === 2 ? "25 XP" : "50 XP"}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">
                Time Estimate
              </label>
              <div className="flex gap-1.5">
                {[15, 30, 60, 90].map((m) => (
                  <button key={m} onClick={() => setEstimatedMinutes(m)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      estimatedMinutes === m
                        ? "bg-brand-500 text-white shadow-md"
                        : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
                    }`}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    categoryId === cat.id
                      ? "ring-2 ring-offset-1 dark:ring-offset-surface-900 shadow-sm"
                      : "bg-surface-100 dark:bg-surface-800"
                  }`}
                  style={{
                    backgroundColor:
                      categoryId === cat.id ? cat.color + "20" : undefined,
                    color: categoryId === cat.id ? cat.color : undefined,
                    outlineColor: categoryId === cat.id ? cat.color : undefined,
                    outlineWidth: categoryId === cat.id ? "2px" : undefined,
                    outlineStyle: categoryId === cat.id ? "solid" : undefined,
                    outlineOffset: "2px",
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm font-medium">Recurring task</span>
            </label>
            {isRecurring && (
              <div className="mt-3 flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day.toLowerCase())}
                    className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${
                      recurrenceDays.includes(day.toLowerCase())
                        ? "bg-brand-500 text-white shadow-md"
                        : "bg-surface-100 dark:bg-surface-800 text-surface-500"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-surface-500">
                Links
              </label>
              <button
                onClick={() => setShowLinkInput(true)}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Link
              </button>
            </div>

            {links.length > 0 && (
              <div className="space-y-2 mb-3">
                {links.map((link) => {
                  const Icon = linkIcons[link.linkType] || LinkIcon;
                  return (
                    <div
                      key={link.id}
                      className="flex items-center gap-2 p-2.5 bg-surface-50 dark:bg-surface-800/50 rounded-lg group"
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${getLinkColor(link.linkType)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{link.title}</p>
                        <p className="text-xs text-surface-400 truncate">{link.url}</p>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-surface-400" />
                      </a>
                      <button
                        onClick={() => removeLink(link.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {showLinkInput && (
              <div className="p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl space-y-2 animate-scale-in">
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="Paste URL (YouTube, Notion, GitHub...)"
                  autoFocus
                />
                <input
                  type="text"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="Link title (optional)"
                />
                <div className="flex gap-2">
                  <button onClick={addLink} className="btn-primary text-sm py-2 px-4">
                    Add
                  </button>
                  <button
                    onClick={() => { setShowLinkInput(false); setNewLinkUrl(""); setNewLinkTitle(""); }}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sub-tasks */}
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-2">
              Sub-tasks
            </label>
            {subTasks.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {subTasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg"
                  >
                    <GripVertical className="w-4 h-4 text-surface-300" />
                    <span className="flex-1 text-sm">{st.title}</span>
                    <button
                      onClick={() => removeSubTask(st.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-surface-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubTask()}
                className="input-field text-sm py-2 flex-1"
                placeholder="Add a sub-task..."
              />
              <button onClick={addSubTask} className="btn-secondary text-sm py-2 px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="btn-primary flex-1"
          >
            {task ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
