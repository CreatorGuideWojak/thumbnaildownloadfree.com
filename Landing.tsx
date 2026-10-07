import AdSlot from "@/components/AdSlot";
import Downloader from "@/components/Downloader";
import FaqList from "@/components/FaqList";
import JsonLd from "@/components/JsonLd";
import type { Faq } from "@/lib/faq";
import { abs, site } from "@/lib/site";
import type { Platform } from "@/lib/types";

type Props = {
  path: string;
  crumb: string;
  platform: Platform;
  h1: string;
  intro: string;
  sections: { heading: string; body: string }[];
  faq: Faq[];
};

export default function Landing({ path, crumb, platform, h1, intro, sections, faq }: Props) {
  return (
    <>
      <div className="pb-4 pt-12 sm:pt-16">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{h1}</h1>
        <p className="mt-4 max-w-[60ch] text-lg text-muted">{intro}</p>
      </div>

      <Downloader platformHint={platform} />
      <AdSlot placement="below downloader" />

      <div className="mt-4 grid gap-10 md:grid-cols-2">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-2xl font-bold">{s.heading}</h2>
            <p className="mt-2 max-w-[60ch] text-muted">{s.body}</p>
          </section>
        ))}
      </div>

      <AdSlot placement="between sections" />

      <section className="mt-4" aria-labelledby="faq-h">
        <h2 id="faq-h" className="mb-4 text-2xl font-bold">FAQ</h2>
        <FaqList items={faq} />
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: `${crumb} Thumbnail Downloader`,
              url: abs(path),
              description: intro,
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            },
            {
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: site.name, item: abs("/") },
                { "@type": "ListItem", position: 2, name: crumb, item: abs(path) },
              ],
            },
          ],
        }}
      />
    </>
  );
}
