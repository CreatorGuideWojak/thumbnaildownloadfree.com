import type { Faq } from "@/lib/faq";

export default function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y-2 divide-ink border-y-2 border-ink">
      {items.map((f) => (
        <details key={f.id} className="group py-4">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-start justify-between gap-4 font-display text-lg font-semibold">
            {f.q}
            <span aria-hidden className="mt-1 text-xl leading-none transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 max-w-[65ch] text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
