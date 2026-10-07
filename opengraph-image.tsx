import { ImageResponse } from "next/og";

export const alt = "ThumbnailDownloadFree - YouTube and Instagram Thumbnail Downloader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", background: "#E7ECEF", color: "#10151C", padding: 72 }}>
        <div style={{ display: "flex", height: 24, background: "#10151C" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 80, fontWeight: 800, lineHeight: 1.05 }}>Download YouTube &amp; Instagram Thumbnails</div>
          <div style={{ display: "flex", fontSize: 36, marginTop: 24 }}>Get high-quality thumbnails from public videos in seconds.</div>
        </div>
        <div style={{ display: "flex", height: 24, background: "#FFC629" }} />
      </div>
    ),
    size
  );
}
