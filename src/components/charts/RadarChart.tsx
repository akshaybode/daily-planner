"use client";

import React from "react";
import { RadarData } from "@/lib/types";

interface RadarChartProps {
  data: RadarData;
  size?: number;
}

const LABELS = [
  { key: "discipline" as const, label: "Discipline" },
  { key: "completion" as const, label: "Completion" },
  { key: "consistency" as const, label: "Consistency" },
  { key: "difficulty" as const, label: "Challenge" },
  { key: "streakScore" as const, label: "Streak" },
];

export default function RadarChart({ data, size = 260 }: RadarChartProps) {
  const center = size / 2;
  const maxR = size * 0.38;
  const levels = 4;
  const count = LABELS.length;
  const angleStep = (2 * Math.PI) / count;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, radius: number) => {
    const angle = startAngle + index * angleStep;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  };

  const gridPaths = Array.from({ length: levels }, (_, level) => {
    const r = maxR * ((level + 1) / levels);
    const points = Array.from({ length: count }, (_, i) => getPoint(i, r));
    return points.map((p) => `${p.x},${p.y}`).join(" ");
  });

  const dataPoints = LABELS.map((l, i) => {
    const val = Math.min(100, Math.max(0, data[l.key]));
    return getPoint(i, (val / 100) * maxR);
  });
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridPaths.map((points, i) => (
          <polygon key={i} points={points} fill="none" stroke="currentColor"
            className="text-surface-200 dark:text-surface-700" strokeWidth="1" />
        ))}
        {LABELS.map((_, i) => {
          const end = getPoint(i, maxR);
          return <line key={i} x1={center} y1={center} x2={end.x} y2={end.y}
            stroke="currentColor" className="text-surface-200 dark:text-surface-700" strokeWidth="1" />;
        })}
        <polygon points={dataPath} fill="url(#radarFill)" stroke="url(#radarStroke)" strokeWidth="2" />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#8b5cf6" strokeWidth="2" />
        ))}
        <defs>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {LABELS.map((l) => (
          <div key={l.key} className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-surface-600 dark:text-surface-400">{l.label}:</span>
            <span className="font-bold">{data[l.key]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
