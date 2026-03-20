"use client";

import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";

interface WeightEntry {
  date: string;
  weightKg: number;
}

interface WeightChartProps {
  data: WeightEntry[];
  targetWeight?: number;
  isAr?: boolean;
}

export function WeightChart({ data, targetWeight, isAr }: WeightChartProps) {
  const chartData = useMemo(() =>
    [...data].reverse().map(d => ({
      date: new Date(d.date).toLocaleDateString(isAr ? "ar" : "en", { day: "numeric", month: "short" }),
      weight: d.weightKg,
    })), [data, isAr]
  );

  if (!chartData.length) return null;

  const minW = Math.min(...chartData.map(d => d.weight)) - 2;
  const maxW = Math.max(...chartData.map(d => d.weight)) + 2;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis domain={[minW, maxW]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--text-muted)" }}
          formatter={(value: any) => [`${value} kg`, isAr ? "الوزن" : "Weight"]}
        />
        <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: "var(--accent)", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "var(--accent)" }} />
        {targetWeight && (
          <ReferenceLine y={targetWeight} stroke="var(--success)" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: isAr ? "الهدف" : "Target", fill: "var(--success)", fontSize: 10, position: "right" }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
