"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Task } from "@/lib/types";
import * as store from "@/lib/store";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Check, Timer, Volume2, VolumeX } from "lucide-react";

interface PomodoroTimerProps {
  userId: string;
  tasks: Task[];
  onComplete: () => void;
}

const PRESETS = [
  { label: "Focus", minutes: 25 },
  { label: "Short Break", minutes: 5 },
  { label: "Long Break", minutes: 15 },
  { label: "Deep Work", minutes: 50 },
];

export default function PomodoroTimer({ userId, tasks, onComplete }: PomodoroTimerProps) {
  const [duration, setDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    store.getPomodoroCount(userId).then(setCompletedCount);
  }, [userId]);

  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 800; gain.gain.value = 0.3;
      osc.start(); osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.frequency.value = 1000; gain2.gain.value = 0.3;
        osc2.start(); osc2.stop(ctx.currentTime + 0.5);
      }, 400);
    } catch { /* silent fallback */ }
  }, [soundEnabled]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      playSound();
      if (sessionId) {
        store.completePomodoro(sessionId, userId).then(() => {
          store.getPomodoroCount(userId).then(setCompletedCount);
          onComplete();
        });
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, secondsLeft, sessionId, userId, onComplete, playSound]);

  const handleStart = async () => {
    if (!isRunning && secondsLeft === totalSeconds) {
      const id = await store.startPomodoro(userId, linkedTaskId, duration);
      setSessionId(id);
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(duration * 60);
    setSessionId("");
  };

  const handlePreset = (mins: number) => {
    if (isRunning) return;
    setDuration(mins);
    setSecondsLeft(mins * 60);
    setSessionId("");
  };

  const incompleteTasks = tasks.filter((t) => !t.isCompleted);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-6 h-6 text-brand-500" />
            <h2 className="text-2xl font-bold">Focus Timer</h2>
          </div>
          <p className="text-surface-500">{completedCount} sessions completed</p>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="btn-ghost p-2">
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-surface-400" />}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.minutes)}
            disabled={isRunning}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              duration === p.minutes && !isRunning
                ? "bg-brand-500 text-white shadow-lg"
                : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700",
              isRunning && "opacity-50 cursor-not-allowed"
            )}
          >
            {p.label} ({p.minutes}m)
          </button>
        ))}
      </div>

      <div className="glass-card p-8 flex flex-col items-center">
        <div className="relative w-52 h-52 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-200 dark:text-surface-700" />
            <circle cx="100" cy="100" r={radius} fill="none" stroke="url(#pomGrad)" strokeWidth="8" strokeLinecap="round"
              style={{ strokeDasharray: circumference, strokeDashoffset, transition: "stroke-dashoffset 1s linear" }} />
            <defs>
              <linearGradient id="pomGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            {secondsLeft === 0 && <span className="text-sm font-medium text-emerald-500 mt-1">Done!</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button onClick={handleStart} disabled={secondsLeft === 0} className="btn-primary px-8 py-3 text-lg">
              <Play className="w-5 h-5" /> {secondsLeft < totalSeconds ? "Resume" : "Start"}
            </button>
          ) : (
            <button onClick={handlePause} className="btn-secondary px-8 py-3 text-lg">
              <Pause className="w-5 h-5" /> Pause
            </button>
          )}
          <button onClick={handleReset} className="btn-ghost p-3">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {incompleteTasks.length > 0 && (
        <div className="glass-card p-4">
          <p className="text-sm font-medium mb-3 text-surface-500">Link to a task (optional)</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            <button onClick={() => setLinkedTaskId(null)} className={cn("w-full text-left text-sm p-2.5 rounded-lg transition-colors", !linkedTaskId ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium" : "hover:bg-surface-50 dark:hover:bg-surface-800")}>
              No task linked
            </button>
            {incompleteTasks.slice(0, 10).map((task) => (
              <button key={task.id} onClick={() => setLinkedTaskId(task.id)} className={cn("w-full text-left text-sm p-2.5 rounded-lg transition-colors", linkedTaskId === task.id ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium" : "hover:bg-surface-50 dark:hover:bg-surface-800")}>
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
