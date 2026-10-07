import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Downloader from "@/components/Downloader";
import FaqList from "@/components/FaqList";
import JsonLd from "@/components/JsonLd";
import { FAQ } from "@/lib/faq";
import { abs, site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <div className="pb-4 pt-10 sm:pt-16">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Download YouTube &amp; Instagram Thumbnails
        </h1>
        <p className="mt-5 max-w-[58ch] text-lg text-muted">
          Get high-quality thumbnails from public videos in seconds. No sign-up, and private content is never accessed.
        </p>
      </div>

      <Downloader />
      <AdSlot placement="below downloader" />

      <section className="mt-4" aria-label="Supported platforms">
        <h2 className="text-2xl font-bold">Supported platforms</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <Link href="/youtube-thumbnail-downloader" className="border-2 border-ink bg-white p-5 hover:bg-signal">
            <h3 className="text-xl font-bold">YouTube</h3>
            <p className="mt-1 text-muted">Videos and live streams, in every size YouTube actually generated.</p>
          </Link>
          <Link href="/youtube-shorts-thumbnail-downloader" className="border-2 border-ink bg-white p-5 hover:bg-signal">
            <h3 className="text-xl font-bold">YouTube Shorts</h3>
            <p className="mt-1 text-muted">Same reliable extraction, tuned for shorts.com/shorts/ links.</p>
          </Link>
          <Link href="/instagram-thumbnail-downloader" className="border-2 border-ink bg-white p-5 hover:bg-signal">
            <h3 className="text-xl font-bold">Instagram</h3>
            <p className="mt-1 text-muted">Preview for public posts and reels. Download isn't available yet — see why in the FAQ.</p>
          </Link>
        </div>
      </section>

      <AdSlot placement="between sections" />

      <section className="mt-4" aria-labelledby="how-h">
        <h2 id="how-h" className="text-2xl font-bold">How it works</h2>
        <ol className="mt-4 grid gap-6 md:grid-cols-4">
          {[
            ["Copy the video URL", "From YouTube, Shorts, live streams, or a public Instagram post."],
            ["Paste it above", "Into the box at the top of this page."],
            ["Get your thumbnail", "We check which sizes actually exist and show them."],
            ["Download it", "Save the file, or copy its direct image URL."],
          ].map(([t, d], i) => (
            <li key={t} className="border-l-4 border-ink pl-4">
              <span className="text-sm font-semibold text-muted">Step {i + 1}</span>
              <h3 className="text-lg font-bold">{t}</h3>
              <p className="mt-1 text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16" aria-labelledby="faq-h">
        <h2 id="faq-h" className="mb-4 text-2xl font-bold">FAQ</h2>
        <FaqList items={FAQ.slice(0, 5)} />
        <p className="mt-4"><Link href="/faq" className="font-semibold underline underline-offset-4">All questions</Link></p>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: site.name,
          url: abs("/"),
          description: site.description,
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
    </>
  );
}
