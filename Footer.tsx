import Link from "next/link";
import { site } from "@/lib/site";
import AdSlot from "./AdSlot";

export default function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-ink">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted">
        <AdSlot placement="footer" />
        <ul className="flex flex-wrap gap-x-6 gap-y-1 font-medium text-ink">
          <li><Link href="/privacy" className="inline-block py-2 underline-offset-4 hover:underline">Privacy Policy</Link></li>
          <li><Link href="/terms" className="inline-block py-2 underline-offset-4 hover:underline">Terms</Link></li>
          <li><Link href="/dmca" className="inline-block py-2 underline-offset-4 hover:underline">DMCA</Link></li>
          <li><a href={`mailto:${site.email}`} className="inline-block py-2 underline-offset-4 hover:underline">Contact</a></li>
        </ul>
        <p className="mt-3 max-w-[70ch]">
          {site.name} does not host or own the content it links to. It is not affiliated with, endorsed by or sponsored by
          YouTube, Google, Instagram or Meta, and all trademarks belong to their owners. Thumbnails belong to their creators.
        </p>
      </div>
    </footer>
  );
}
