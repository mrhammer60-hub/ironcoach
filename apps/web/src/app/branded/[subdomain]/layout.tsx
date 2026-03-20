import { notFound } from "next/navigation";
import { BrandProvider } from "../../../../components/branded/brand-provider";

async function fetchOrgBySubdomain(subdomain: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(
      `${apiUrl}/api/v1/organizations/by-subdomain/${subdomain}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { subdomain: string };
}) {
  const org = await fetchOrgBySubdomain(params.subdomain);
  if (!org) return { title: "Not Found" };
  return {
    title: `${org.name} — Powered by IronCoach`,
    description: org.bio ?? `تدريب احترافي مع ${org.name}`,
  };
}

export default async function BrandedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { subdomain: string };
}) {
  const org = await fetchOrgBySubdomain(params.subdomain);
  if (!org) notFound();

  const brand = {
    orgId: org.id,
    orgName: org.name,
    logoUrl: org.logoUrl ?? null,
    brandColor: org.brandColor ?? "#c8f135",
    subdomain: org.subdomain,
  };

  return (
    <BrandProvider org={brand}>
      <div
        style={
          { "--brand-color": brand.brandColor } as React.CSSProperties
        }
        className="min-h-screen"
      >
        {children}
      </div>
    </BrandProvider>
  );
}
