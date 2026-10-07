import { site } from "@/lib/site";

/**
 * Reserves layout space for a future AdSense unit. Renders nothing (not even
 * a placeholder box) unless NEXT_PUBLIC_ADS_ENABLED=true AND an AdSense
 * client ID is configured — we never show a fake/placeholder ad.
 */
export default function AdSlot({ placement }: { placement: string }) {
  if (!site.adsEnabled) return null;
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!client) return null;

  return (
    <div className="my-10 border border-dashed border-ink/20 py-2 text-center text-xs text-muted" aria-label={`Advertisement (${placement})`}>
      {/* Wire up <ins className="adsbygoogle"> here once an ad unit is created. */}
      Ad space reserved ({placement})
    </div>
  );
}
