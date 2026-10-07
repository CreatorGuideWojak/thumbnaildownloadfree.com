"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { ApiErrorBody, Platform, ThumbnailResult } from "@/lib/types";
import { detectPlatform, parseMediaUrl } from "@/lib/validate";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: ThumbnailResult };

const PLACEHOLDER: Record<Platform, string> = {
  youtube: "https://www.youtube.com/watch?v=…",
  instagram: "https://www.instagram.com/p/…",
};

export default function Downloader({ platformHint }: { platformHint?: Platform }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const detected = detectPlatform(value);
  const hint = !value.trim()
    ? "Works with public YouTube and Instagram links."
    : detected === "youtube"
      ? "YouTube link detected."
      : detected === "instagram"
        ? "Instagram link detected."
        : "That isn't a YouTube or Instagram link yet.";

  useEffect(() => () => abortRef.current?.abort(), []);

  async function submit(url: string) {
    const parsed = parseMediaUrl(url);
    if (!parsed.ok) {
      setState({ status: "error", message: parsed.message });
      track("thumbnail_error", { code: parsed.code, stage: "client" });
      inputRef.current?.focus();
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState({ status: "loading" });
    setSelected(0);
    setImgFailed(false);
    track("thumbnail_submit", { platform: parsed.target.platform });

    try {
      const res = await fetch("/api/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: ctrl.signal,
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const err = (data as ApiErrorBody | null)?.error;
        setState({ status: "error", message: err?.message ?? "We couldn't retrieve a thumbnail from this URL. Try again." });
        track("thumbnail_error", { code: err?.code ?? "UNKNOWN", stage: "server" });
        return;
      }
      setState({ status: "success", result: data as ThumbnailResult });
      track("thumbnail_success", { platform: parsed.target.platform });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState({ status: "error", message: "Couldn't reach the server. Check your connection and try again." });
      track("thumbnail_error", { code: "NETWORK", stage: "client" });
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.status === "loading") return;
    void submit(value);
  }

  function reset() {
    setState({ status: "idle" });
    setValue("");
    setSelected(0);
    setImgFailed(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function onPaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setValue(text.trim());
    } catch {
      /* permission denied: the user can paste manually */
    }
    inputRef.current?.focus();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* noop */ }
      ta.remove();
    }
    setCopied(true);
    track("copy_image_url");
    window.setTimeout(() => setCopied(false), 1800);
  }

  const busy = state.status === "loading";

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="border-2 border-ink bg-slide p-4 sm:p-5">
        <label htmlFor="media-url" className="block text-sm font-semibold">Paste video URL here</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="media-url"
            ref={inputRef}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={2048}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={PLACEHOLDER[platformHint ?? "youtube"]}
            aria-describedby="media-url-hint"
            className="min-w-0 flex-1 rounded-md border-2 border-ink bg-white px-4 py-3 text-base placeholder:text-muted/70"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onPaste} className="rounded-md border-2 border-ink bg-white px-4 py-3 font-semibold hover:bg-table">
              Paste
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-md border-2 border-ink bg-signal px-5 py-3 font-semibold hover:brightness-95 disabled:cursor-wait disabled:opacity-70 sm:flex-none"
            >
              {busy ? "Finding thumbnail…" : "Get Thumbnail"}
            </button>
          </div>
        </div>
        <p id="media-url-hint" className="mt-2 text-sm text-muted">{hint}</p>
      </form>

      <div aria-live="polite" className="mt-6">
        {state.status === "loading" && <Skeleton />}
        {state.status === "error" && (
          <div role="alert" className="border-2 border-danger bg-white p-4">
            <p className="font-semibold text-danger">Couldn&apos;t get that thumbnail</p>
            <p className="mt-1 text-ink">{state.message}</p>
          </div>
        )}
        {state.status === "success" && (
          <ResultView
            result={state.result}
            selected={selected}
            onSelect={(i) => { setSelected(i); setImgFailed(false); }}
            copied={copied}
            onCopy={copy}
            imgFailed={imgFailed}
            onImgError={() => setImgFailed(true)}
            onDownload={() => track("thumbnail_download", { platform: state.result.platform })}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="border-2 border-ink bg-white" role="status" aria-label="Finding thumbnail">
      <div className="perforations" aria-hidden />
      <div className="aspect-video animate-pulse bg-ink/10" />
      <div className="perforations" aria-hidden />
      <p className="p-3 text-sm text-muted">Finding thumbnail…</p>
    </div>
  );
}

function ResultView(props: {
  result: ThumbnailResult;
  selected: number;
  onSelect: (i: number) => void;
  copied: boolean;
  onCopy: (text: string) => void;
  imgFailed: boolean;
  onImgError: () => void;
  onDownload: () => void;
  onReset: () => void;
}) {
  const { result, selected, onSelect, copied, onCopy, imgFailed, onImgError, onDownload, onReset } = props;

  if (result.platform === "instagram") {
    return (
      <section aria-label="Instagram preview" className="space-y-4">
        <div className="border-2 border-ink bg-white p-3">
          <iframe
            src={result.embedUrl}
            title="Instagram post preview"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="mx-auto block h-[560px] w-full max-w-[540px] border-0"
          />
        </div>
        <p className="border-2 border-ink bg-white p-4 text-sm">
          Instagram doesn&apos;t provide a downloadable thumbnail image through public channels, so this is a preview
          only. Open the post on Instagram to save anything from it.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border-2 border-ink bg-signal px-5 py-3 text-center font-semibold hover:brightness-95"
          >
            Open on Instagram
          </a>
          <button type="button" onClick={onReset} className="rounded-md border-2 border-ink bg-white px-5 py-3 font-semibold hover:bg-table">
            Download Another
          </button>
        </div>
      </section>
    );
  }

  const v = result.variants[selected] ?? result.variants[0];

  return (
    <section aria-label="Thumbnail result" className="space-y-4">
      {(result.title || result.author) && (
        <div>
          {result.title && <h2 className="font-display text-xl font-bold">{result.title}</h2>}
          {result.author && <p className="text-sm text-muted">{result.author}</p>}
        </div>
      )}

      <figure className="border-2 border-ink bg-ink">
        <div className="perforations" aria-hidden />
        {imgFailed ? (
          <p className="bg-white p-6 text-sm">This size failed to load. Try another size below.</p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.url}
            alt={`${result.title ?? "Video"} thumbnail, ${v.quality}`}
            width={v.width}
            height={v.height}
            onError={onImgError}
            className="mx-auto h-auto max-h-[70vh] w-full object-contain"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="perforations" aria-hidden />
      </figure>

      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <dt className="font-semibold text-muted">Resolution</dt>
          <dd className="font-display text-lg font-bold">{v.width} × {v.height}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">Quality</dt>
          <dd className="font-display text-lg font-bold">{v.quality}</dd>
        </div>
      </dl>

      {result.variants.length > 1 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Available sizes">
          {result.variants.map((x, i) => (
            <li key={x.key}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-pressed={i === selected}
                className={`w-full border-2 p-2 text-left text-sm ${i === selected ? "border-ink bg-signal" : "border-ink/30 bg-white hover:border-ink"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.url} alt="" loading="lazy" className="aspect-video w-full bg-ink/10 object-cover" referrerPolicy="no-referrer" />
                <span className="mt-2 block font-semibold">{x.quality}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={v.downloadUrl}
          download={v.filename}
          onClick={onDownload}
          className="rounded-md border-2 border-ink bg-signal px-5 py-3 text-center font-semibold hover:brightness-95"
        >
          Download Thumbnail
        </a>
        <button type="button" onClick={() => onCopy(v.url)} className="rounded-md border-2 border-ink bg-white px-5 py-3 font-semibold hover:bg-table">
          {copied ? "Copied" : "Copy Image URL"}
        </button>
        <button type="button" onClick={onReset} className="rounded-md border-2 border-ink bg-white px-5 py-3 font-semibold hover:bg-table">
          Download Another
        </button>
      </div>
      <input
        readOnly
        value={v.url}
        aria-label="Direct image URL"
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-md border-2 border-ink/30 bg-white px-3 py-2 text-sm text-muted"
      />

      <p className="text-sm text-muted">Thumbnails belong to their creators. Download only what you have permission to use.</p>
    </section>
  );
}
