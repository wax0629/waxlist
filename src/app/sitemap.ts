import type { MetadataRoute } from "next";
import { listReleases } from "@/lib/releases/store";
import { publicSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicSiteUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/explore`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/explore/today`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/explore/submit`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/chat`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
  ];

  try {
    const releases = await listReleases({ status: "published" });
    const albumRoutes = releases.slice(0, 500).map((release) => ({
      url: `${base}/explore/${release.id}`,
      lastModified: release.updated_at ? new Date(release.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    return [...staticRoutes, ...albumRoutes];
  } catch {
    return staticRoutes;
  }
}
