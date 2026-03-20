"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface PREntry {
  exerciseId: string;
  exerciseName: string;
  exerciseNameAr?: string;
  muscleGroup: string;
  weightKg: number;
  reps: number;
}

const MUSCLE_COLORS: Record<string, string> = {
  CHEST: "var(--error)",
  BACK: "var(--info)",
  LEGS: "var(--warning)",
  SHOULDERS: "var(--success)",
  BICEPS: "var(--accent)",
  TRICEPS: "#a78bfa",
  CORE: "#f472b6",
  GLUTES: "#fb923c",
};

export function StrengthPRChart({ data, isAr }: { data: PREntry[]; isAr?: boolean }) {
  const chartData = data.slice(0, 8).map(pr => ({
    name: isAr ? (pr.exerciseNameAr || pr.exerciseName) : pr.exerciseName,
    weight: pr.weightKg,
    muscleGroup: pr.muscleGroup,
  }));

  if (!chartData.length) return null;

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
        <Tooltip
          contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          formatter={(value: any) => [`${value} kg`, isAr ? "أعلى وزن" : "Best"]}
        />
        <Bar dataKey="weight" radius={[0, 6, 6, 0]} barSize={20}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={MUSCLE_COLORS[entry.muscleGroup] || "var(--accent)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
