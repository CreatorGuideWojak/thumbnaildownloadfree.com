"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-24" role="alert">
      <h1 className="text-4xl font-extrabold">Something broke</h1>
      <p className="mt-3 text-muted">An unexpected error occurred. Try again.</p>
      <button onClick={reset} className="mt-6 border-2 border-ink bg-signal px-5 py-3 font-semibold">Try again</button>
    </div>
  );
}
