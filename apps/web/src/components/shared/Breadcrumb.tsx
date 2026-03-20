"use client";

import Link from "next/link";
import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-2 text-[13px] mb-5">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-[var(--text-muted)] text-[10px]">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--text-primary)] font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
