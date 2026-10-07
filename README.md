# ThumbnailDownloadFree (YouTube + Instagram Thumbnail Downloader)

Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · API routes. No database.

---

## ⚠️ FINAL VERIFICATION REQUIRED ON A NETWORK-ENABLED MACHINE

This project was built and tested entirely inside a sandbox **with no outbound internet access**. That sandbox could run the test suite and a real TypeScript typecheck (both genuinely passed — see results below), but it could not install any npm package at all: every attempt returned `403 Forbidden` from `https://registry.npmjs.org`. That means the following have **never been run successfully, by anyone, anywhere**, and must be run for real before this is considered deployable:

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

Run them **in this exact order**, on a machine or CI environment with real internet access. If any step fails, stop and fix it before moving to the next — don't deploy on top of a failure. **Do not treat this project as production-verified until all six of these have actually succeeded on a real machine.** Nothing in this README, however confident it sounds elsewhere, substitutes for that.

Specifically still required:
- **`npm install`** — blocked here by the registry 403 above. This also means **`package-lock.json` does not exist yet** in this ZIP; it will be generated the first time `npm install` succeeds, and should be committed afterward for reproducible builds. Do not hand-write or fake one.
- **`npm run lint`** — never run (ESLint couldn't be installed).
- **`npm run build`** — never run (a real Next.js install couldn't happen, and `next/font/google` separately needs network access at build time to fetch font files).
- **Instagram live behavior** — the preview/availability logic is only tested against mocked responses. It has not been checked against real Instagram traffic (a real public post, a real private post, a deleted post). Do this manually after deployment.
- **Node.js 20+** — required (`.nvmrc` and `package.json engines` both pin this). Confirm your deployment target actually runs 20 or newer.
- **`NEXT_PUBLIC_SITE_URL`** — required in production; the build intentionally throws if it's unset, to stop a real deployment from silently shipping `localhost` links in its sitemap/canonical URLs/Open Graph tags.
- **Rate limiting is per-process, in-memory** — correct for a single instance, but resets on restart and doesn't coordinate across multiple instances/serverless replicas. Fine to ship as-is for modest traffic; swap in a shared store (e.g. Redis) behind the same `src/lib/rateLimit.ts` function signature if traffic grows.

---

## 🚀 Deployment guide (no coding knowledge required)

Follow these steps in order. Each one builds on the last — don't skip ahead.

### STEP 1 — Install Node.js
Download and install **Node.js version 20 or newer** (the "LTS" build) from https://nodejs.org. This installs both `node` and `npm`, which you need for every step below. To check it worked, open a terminal and run `node -v` — it should print `v20.x.x` or higher.

### STEP 2 — Extract the ZIP
Unzip `thumbnail-downloader-PRODUCTION.zip` anywhere on your computer (Desktop is fine). You'll get a folder named `thumbnail-downloader`.

### STEP 3 — Open a terminal in the project folder
- **Windows**: open the `thumbnail-downloader` folder in File Explorer, then type `cmd` in the address bar and press Enter.
- **Mac**: right-click the `thumbnail-downloader` folder → "New Terminal at Folder" (or open Terminal and type `cd ` followed by dragging the folder in).
- **Linux**: open a terminal, `cd` into the extracted folder.

### STEP 4 — Install dependencies
```bash
npm install
```
This downloads everything the project needs (Next.js, React, etc.) from the internet — it requires a working internet connection and can take a minute or two. **This has not been run successfully anywhere yet** — the sandbox this project was built in has no internet access, so this will be the very first real install. If it fails, the error message will tell you what's missing; the most common cause is an outdated Node.js version (see Step 1).

### STEP 5 — Configure environment variables
Copy the example file to create your real config:
```bash
cp .env.example .env.local
```
(On Windows, use `copy .env.example .env.local` instead.)

Open `.env.local` in any text editor and set at minimum:
```
NEXT_PUBLIC_SITE_URL=https://your-real-domain.com
```
For example, the production domain for this project is `thumbnaildownloadfree.com`, so the final production value is:
```
NEXT_PUBLIC_SITE_URL=https://thumbnaildownloadfree.com
```
Everything else is optional — see the full variable table further down. **Never put real secrets in `.env.example`** — that file ships with the code and is meant to only show placeholder names. Your real values go in `.env.local`, which is already excluded from the ZIP/repo.

### STEP 6 — Run the tests
```bash
npm test
```
Expected result: **43/43 passing**. If anything fails here, stop and investigate before continuing — don't deploy on top of a failing test.

### STEP 7 — Run the typecheck
```bash
npx tsc --noEmit
```
This should complete with no errors printed.

### STEP 8 — Run the linter
```bash
npm run lint
```
This checks code style/quality. Fix anything it flags before deploying (it was never run successfully before this, since ESLint couldn't be installed without internet — see "What must be verified" below).

### STEP 9 — Build for production
```bash
npm run build
```
This compiles the whole app. It's the single most important step to watch — if it fails, **do not deploy**; read the error output, it will point at the specific file/line.

### STEP 10 — Start the production server
```bash
npm start
```
This runs the actual production server (not the dev server). Open `http://localhost:3000` in a browser to see it live. Press Ctrl+C in the terminal to stop it.

Once Steps 6–10 all succeed on your machine, the project is ready to hand to a hosting platform.

---

## Hosting requirements

Whatever platform you deploy to (Vercel, Railway, Render, a VPS, etc.) needs:

- **Node.js 20+ support** (this project's `.nvmrc` pins `20`).
- **Next.js App Router support** — any modern Node host that runs `npm run build` + `npm start` works; Vercel supports this natively with zero config.
- **The ability to set environment variables** in the host's dashboard (not just a `.env` file — most hosts want them entered separately for security).
- **HTTPS** — required for the site to work correctly and for browsers to trust it; nearly every modern host (Vercel, Railway, Render, Cloudflare) provides this automatically with a free certificate.
- **Enough memory to run a Node process** — this is a lightweight app with no database, so the smallest/free tier on most platforms is enough to start.
- **Outbound internet access from the server itself.** This is not optional: every thumbnail lookup requires the server to reach `i.ytimg.com` (YouTube) and, for Instagram previews, `instagram.com`. If your host blocks outbound requests (some locked-down corporate/VPS setups do), the app will run but every lookup will fail with an "upstream" error.

## Connecting a custom domain

Once deployed and working on your host's default URL (e.g. `your-app.vercel.app`), most hosts let you add a custom domain from their dashboard: you add the domain there, then update your domain's DNS records (usually a `CNAME` or `A` record) at wherever you bought the domain. After that, update `NEXT_PUBLIC_SITE_URL` in your host's environment variables to the final `https://yourdomain.com` and redeploy — this value drives the sitemap, canonical URLs and social-share previews. **This project does not purchase or configure a domain for you** — that's a manual step you do on your registrar/host of choice, whenever you're ready.

---

## Deployment checklist

```
[ ] npm install
[ ] npm test              → expect 43/43
[ ] npx tsc --noEmit       → expect no errors
[ ] npm run lint           → fix anything flagged
[ ] npm run build          → must succeed, don't deploy if it fails
[ ] npm start               → confirm it runs locally
[ ] Open the site in a browser
[ ] Test a real YouTube URL end to end
[ ] Confirm the thumbnail preview loads
[ ] Confirm the JPEG actually downloads with the right filename
[ ] Test an invalid/garbage URL → should show a friendly error, not a crash
[ ] Test the site on a real phone (not just a resized browser window)
[ ] Test a real public Instagram post/reel URL
[ ] Connect your custom domain (optional)
[ ] Confirm HTTPS is active (host-provided, should be automatic)
[ ] Do one more full pass on the live, deployed site before calling it done
```

---

## Architecture

| Piece | File |
|---|---|
| URL parsing, platform detection (shared client/server) | `src/lib/validate.ts` |
| Single source of truth for every user-facing error message | `src/lib/messages.ts` |
| Typed API error (`code`, HTTP `status`, optional `message`) | `src/lib/errors.ts` |
| YouTube: probes each size with a real (ranged) GET, reads true JPEG dimensions, caches 10 min, title via public oEmbed | `src/lib/youtube.ts`, `src/lib/jpeg.ts`, `src/lib/cache.ts` |
| Instagram: **preview only** — no image extraction (see below) | `src/lib/instagram.ts` |
| `POST /api/thumbnail` — validate, rate limit, resolve | `src/app/api/thumbnail/route.ts` |
| `GET /api/download?id=<videoId>&q=<qualityKey>` — builds the image URL server-side and streams it as an attachment | `src/app/api/download/route.ts`, `src/lib/download.ts` |
| Byte-capped stream reader used by both the probe and the download proxy | `src/lib/stream.ts` |
| Rate limiter (in-memory sliding window) | `src/lib/rateLimit.ts` |
| Result UI (resolution, quality, download/copy/reset) | `src/components/Downloader.tsx` |
| Test suite (Node's built-in test runner, run via `tsx` — no test framework dependency) | `tests/*.test.ts` |

### Why the download endpoint takes `id`+`q`, not a URL

`GET /api/download` never accepts a client-supplied URL. It takes an 11-character YouTube video ID and a quality key (`maxres`/`sd`/`hq`/`mq`/`default`); `src/lib/youtube.ts` maps that pair to a fixed `i.ytimg.com` path itself. There is no URL for an attacker to redirect, so there's no allowlist to bypass.

## Instagram: read this before you promise it in marketing copy

There is **no download button for Instagram**. Meta's official oEmbed endpoint limits use to rendering a front-end embed and no longer reliably returns an image URL anyway, so the app only offers a preview via Instagram's own public embed page. See "Known limitations" below — this behavior has never been checked against live Instagram traffic.

## Security

- Input is parsed with `new URL`, restricted to `youtube.com` (+ `youtube-nocookie.com`), `youtu.be`, `instagram.com` hosts, no credentials or custom ports, length-capped.
- The server never fetches a user-supplied URL directly, for either platform.
- The download proxy refuses redirects, checks content-type, caps size at 2 MB, and times out at 8s.
- Same-origin check on `POST /api/thumbnail`, JSON body size cap, per-IP rate limits (20/min lookups, 60/min downloads, HTTP 429 with `Retry-After`).
- Strict CSP + standard security headers in `next.config.mjs`. No secret is ever sent to the browser.
- `TRUSTED_IP_HEADER` controls which header the rate limiter trusts for the client IP — defaults to `x-forwarded-for`, correct on Vercel/Cloudflare. **Verify this matches your actual host**, or the limiter is either spoofable or useless.
- Errors never leak stack traces or upstream response bodies to the client.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Yes in production** (build throws without it) | Canonical URLs, sitemap, OG tags |
| `NEXT_PUBLIC_SITE_NAME` | No | Site name in UI/metadata |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Shown on Privacy/Terms/DMCA/Footer |
| `TRUSTED_IP_HEADER` | No | Which header the rate limiter trusts (default `x-forwarded-for`) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` / `NEXT_PUBLIC_PLAUSIBLE_SRC` | No | Enables Plausible analytics |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Enables GA4 (gtag), IP-anonymized |
| `NEXT_PUBLIC_ADS_ENABLED` + `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | No, both required together | Renders the reserved (inert) ad slots, loads the AdSense script, and serves `/ads.txt` |

`.env.example` in this repo contains only placeholder names/values — never commit `.env.local` or any file with real secrets in it.

## Available npm commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the local development server with hot-reload |
| `npm run build` | Compiles the production build |
| `npm start` | Runs the compiled production build |
| `npm run typecheck` | Runs `tsc --noEmit` |
| `npm run lint` | Runs ESLint |
| `npm test` | Runs the test suite (41 tests, via Node's built-in test runner) |

## Known limitations

1. **Instagram's availability check has never been verified against live Instagram traffic.** This project was built in a sandbox with no internet access, so `src/lib/instagram.ts`'s logic for telling a public post apart from a private/deleted one is based on documented behavior, not observed behavior. **Test it yourself against a real public post, a real private post, and a deleted post before relying on it.**
2. **Rate limiting is currently per-process** (an in-memory counter). This is fine for a single-instance deployment but resets if the process restarts, and each instance on a multi-instance/serverless host keeps its own separate counters — so the effective limit is `limit × number of instances`, not a true global limit. **If traffic becomes significant, replace `src/lib/rateLimit.ts`'s internals with a shared store (e.g. Upstash Redis) behind the same function signature** — nothing else in the app needs to change.
3. **`npm install`, `npm run lint`, and `npm run build` were never run successfully anywhere.** The sandbox this project was built and audited in has no outbound network access — `npm install` fails immediately with `403 Forbidden` from the npm registry, which also blocks lint (needs ESLint installed) and build (needs a real Next.js install, plus `next/font/google` separately needs network access to fetch font files). **This is the single most important thing to verify** on your own machine or hosting platform: run Steps 4, 6, 7, 8, 9 above yourself and confirm they succeed before trusting this is deployable.
4. **No 4K YouTube thumbnails exist.** The largest YouTube generates is 1280×720, and only for some videos.
5. **No lockfile is included** (couldn't be generated without network access). Running `npm install` for the first time will create `package-lock.json` — commit it afterward for reproducible builds.
6. **Legal pages (Privacy/Terms/DMCA) are templates, not legal advice** — have them reviewed for your jurisdiction. DMCA safe-harbor in the US requires a registered designated agent, which this doesn't set up.

## Testing performed in this environment

`npm test` was run for real (43/43 passing) using Node's built-in test runner via `tsx`, which needed no package install. A real `tsc --noEmit` was also run directly and is clean of genuine errors. **Neither of these substitutes for running the actual `npm install` → `npm run lint` → `npm run build` pipeline**, which requires a network-enabled machine — see limitation 3 above.
