"use client";

import { createContext, useContext } from "react";

export interface BrandContextType {
  orgId: string;
  orgName: string;
  logoUrl: string | null;
  brandColor: string;
  subdomain: string;
}

const BrandContext = createContext<BrandContextType | null>(null);

export function BrandProvider({
  org,
  children,
}: {
  org: BrandContextType;
  children: React.ReactNode;
}): React.JSX.Element {
  return <BrandContext.Provider value={org}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextType {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
}
