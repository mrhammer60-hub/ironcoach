"use client";

import React from "react";

interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyIcon = "📋",
  emptyMessage = "No data",
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4 items-center p-4">
            <div className="w-8 h-8 rounded-full animate-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded animate-shimmer" />
              <div className="h-3 w-1/4 rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-12">
        <span className="text-3xl block mb-3">{emptyIcon}</span>
        <p className="text-sm text-[var(--text-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
            {columns.map(col => (
              <th key={col.key} className="text-start pb-3 font-semibold" style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr
              key={ri}
              className={`border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td key={col.key} className="py-3">
                  {col.render ? col.render((row as any)[col.key], row) : String((row as any)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
