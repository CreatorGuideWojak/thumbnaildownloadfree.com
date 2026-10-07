import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24">
      <h1 className="text-4xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-muted">The page you asked for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="mt-6 inline-block border-2 border-ink bg-signal px-5 py-3 font-semibold">Back to the downloader</Link>
    </div>
  );
}
