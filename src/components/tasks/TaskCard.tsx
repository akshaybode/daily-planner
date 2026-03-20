"use client";

import React, { useState } from "react";
import { Task, Category, TaskLink } from "@/lib/types";
import { cn, getLinkColor } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Pencil,
  Trash2,
  Link as LinkIcon,
  Play,
  FileText,
  Github,
  MessageSquare,
  Table,
  Flame,
  Clock,
  GripVertical,
} from "lucide-react";

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

interface TaskCardProps {
  task: Task;
  category?: Category;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
}

export default function TaskCard({
  task,
  category,
  onToggle,
  onEdit,
  onDelete,
  onToggleSubTask,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = task.links.length > 0 || task.subTasks.length > 0 || task.description;

  const completedSubTasks = task.subTasks.filter((s) => s.isCompleted).length;
  const subTaskProgress =
    task.subTasks.length > 0 ? completedSubTasks / task.subTasks.length : 0;

  return (
    <div
      className={cn(
        "group glass-card overflow-hidden transition-all duration-300",
        task.isCompleted && "opacity-70"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => onToggle(task.id)}
            className={cn(
              "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
              task.isCompleted
                ? "bg-emerald-500 border-emerald-500 scale-100"
                : "border-surface-300 dark:border-surface-600 hover:border-brand-400 hover:scale-110"
            )}
          >
            {task.isCompleted && (
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "font-medium leading-snug transition-all",
                  task.isCompleted && "line-through text-surface-400"
                )}
              >
                {task.title}
              </h3>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-surface-400" />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-surface-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {category && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: category.color + "15",
                    color: category.color,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </span>
              )}
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-md",
                  task.priority === "high" && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
                  task.priority === "medium" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                  task.priority === "low" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                )}
              >
                {task.priority}
              </span>

              {task.links.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-surface-400">
                  <LinkIcon className="w-3 h-3" />
                  {task.links.length}
                </span>
              )}

              {task.subTasks.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-surface-400">
                  <Check className="w-3 h-3" />
                  {completedSubTasks}/{task.subTasks.length}
                </span>
              )}

              {task.isRecurring && (
                <span className="inline-flex items-center gap-1 text-xs text-brand-500">
                  <Flame className="w-3 h-3" />
                  Recurring
                </span>
              )}
            </div>

            {/* Link chips (always visible) */}
            {task.links.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {task.links.map((link) => {
                  const Icon = linkIcons[link.linkType] || LinkIcon;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                        "bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700",
                        "transition-colors group/link"
                      )}
                    >
                      <Icon className={cn("w-3 h-3", getLinkColor(link.linkType))} />
                      <span className="truncate max-w-[120px]">{link.title}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-surface-400 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Sub-task progress */}
            {task.subTasks.length > 0 && (
              <div className="mt-2.5">
                <div className="progress-bar h-1.5">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${subTaskProgress * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 ml-9 flex items-center gap-1 text-xs text-surface-400 hover:text-surface-600 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Details
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 ml-9 space-y-3 animate-fade-in">
          {task.description && (
            <p className="text-sm text-surface-500 leading-relaxed">
              {task.description}
            </p>
          )}

          {task.subTasks.length > 0 && (
            <div className="space-y-1.5">
              {task.subTasks.map((st) => (
                <button
                  key={st.id}
                  onClick={() => onToggleSubTask(task.id, st.id)}
                  className="flex items-center gap-2 w-full text-left group/sub"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                      st.isCompleted
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-surface-300 dark:border-surface-600 group-hover/sub:border-brand-400"
                    )}
                  >
                    {st.isCompleted && (
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      st.isCompleted && "line-through text-surface-400"
                    )}
                  >
                    {st.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
