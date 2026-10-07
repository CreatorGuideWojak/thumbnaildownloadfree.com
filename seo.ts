import type { Metadata } from "next";
import { site } from "./site";

/** `absoluteTitle` bypasses the "%s | Site" template so the title is used exactly as written. */
export function pageMetadata(opts: { title: string; description: string; path: string; absoluteTitle?: boolean }): Metadata {
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: { type: "website", siteName: site.name, title: opts.title, description: opts.description, url: opts.path },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description },
  };
}
