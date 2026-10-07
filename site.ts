const rawUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (process.env.NODE_ENV === "production" && !rawUrl) {
  // Sitemap, canonical URLs, robots.txt and Open Graph all depend on this.
  // Fail the build/boot loudly rather than silently shipping localhost links.
  throw new Error("NEXT_PUBLIC_SITE_URL must be set in production (see .env.example).");
}

export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "ThumbnailDownloadFree",
  url: (rawUrl ?? "http://localhost:3000").replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@example.com",
  description: "ThumbnailDownloadFree is a free online tool to download YouTube and Instagram video thumbnails quickly and easily.",
  adsEnabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
  /** Single source of truth for the "Last updated" date shown on Privacy/Terms/DMCA. Bump when their content changes. */
  lastUpdated: "September 26, 2026",
};

export const abs = (path: string) => `${site.url}${path}`;

/** Analytics is opt-in and purely env-driven; nothing is hard-coded. */
export const analytics = {
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "",
  plausibleSrc: process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js",
  gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
};

/** AdSense is opt-in: both the feature flag and a real client ID must be set. */
export const ads = {
  client: site.adsEnabled ? process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "" : "",
};
