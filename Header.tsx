import Link from "next/link";
import { site } from "@/lib/site";

const nav = [
  { href: "/youtube-thumbnail-downloader", label: "YouTube Thumbnail" },
  { href: "/instagram-thumbnail-downloader", label: "Instagram Thumbnail" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  return (
    <header className="border-b-2 border-ink">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4">
        <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="Main">
          <ul className="flex gap-5 text-sm font-medium">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="underline-offset-4 hover:underline">{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
