import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/coach/", "/trainee/", "/api/"] },
    sitemap: "https://ironcoach.com/sitemap.xml",
  };
}
