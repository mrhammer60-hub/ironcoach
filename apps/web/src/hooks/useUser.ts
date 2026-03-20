"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  locale: string;
  timezone: string;
  role: string;
  organization: { id: string; name: string; slug: string } | null;
}

function hasToken(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("ironcoach_access=");
}

export function useUser() {
  const { data, isLoading } = useQuery<UserInfo>({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<UserInfo>("/auth/me"),
    enabled: hasToken(),
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });

  return {
    user: data ?? null,
    isLoading,
    fullName: data ? `${data.firstName} ${data.lastName}`.trim() : "",
    role: data?.role ?? null,
    orgName: data?.organization?.name ?? "",
  };
}
