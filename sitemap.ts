import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

// Bump this when page content meaningfully changes; keeping it static (rather
// than `new Date()` on every request) avoids implying every page changed today.
const lastModified = new Date("2026-09-26T00:00:00.000Z");

const routes: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/youtube-thumbnail-downloader", priority: 0.9 },
  { path: "/youtube-shorts-thumbnail-downloader", priority: 0.9 },
  { path: "/instagram-thumbnail-downloader", priority: 0.8 },
  { path: "/faq", priority: 0.6 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
  { path: "/dmca", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({ url: abs(r.path), lastModified, changeFrequency: "monthly", priority: r.priority }));
}
