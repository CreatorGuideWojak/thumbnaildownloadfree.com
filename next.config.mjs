const isProd = process.env.NODE_ENV === "production";
const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true" && !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

function originOf(url) {
  try { return new URL(url).origin; } catch { return ""; }
}

const scriptHosts = [
  originOf(process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js"),
  gaId && "https://www.googletagmanager.com",
  adsEnabled && "https://pagead2.googlesyndication.com",
].filter(Boolean);

const connectHosts = [
  originOf(process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js"),
  gaId && "https://www.google-analytics.com",
].filter(Boolean);

const frameHosts = ["https://www.instagram.com", adsEnabled && "https://googleads.g.doubleclick.net"].filter(Boolean);

// NOTE: 'unsafe-inline' is required for Next's inline bootstrap scripts unless you
// switch to a nonce-based CSP via middleware. Everything else is locked down.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} ${scriptHosts.join(" ")}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://i.ytimg.com https://img.youtube.com https://*.cdninstagram.com https://*.fbcdn.net${adsEnabled ? " https://pagead2.googlesyndication.com" : ""}`,
  "font-src 'self'",
  `connect-src 'self' ${connectHosts.join(" ")}`.trim(),
  `frame-src ${frameHosts.join(" ")}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
