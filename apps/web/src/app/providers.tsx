"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import { ToastProvider } from "@/components/shared/Toast";
import { ConnectionBanner } from "@/components/shared/ConnectionBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConnectionBanner />
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
