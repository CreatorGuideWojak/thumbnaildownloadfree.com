import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "@/lib/errors";
import { getYouTubeThumbnails } from "@/lib/youtube";
import { jpegResponse, mockFetch, notFound } from "./helpers";

const canon = (id: string) => `https://www.youtube.com/watch?v=${id}`;

test("only qualities that exist are returned, with real sizes", async () => {
  const id = "aaaaaaaaaa1";
  mockFetch((url) => {
    if (url.includes("oembed")) return Response.json({ title: "Demo", author_name: "Someone" });
    if (url.endsWith("maxresdefault.jpg")) return notFound();
    if (url.endsWith("sddefault.jpg")) return jpegResponse(640, 480, 206);
    if (url.endsWith("hqdefault.jpg")) return jpegResponse(480, 360, 206);
    if (url.endsWith("mqdefault.jpg")) return jpegResponse(320, 180, 206);
    return jpegResponse(120, 90, 206);
  });
  const r = await getYouTubeThumbnails(id, canon(id));
  assert.deepEqual(r.variants.map((v) => v.key), ["sd", "hq", "mq", "default"]);
  assert.equal(r.title, "Demo");
  const hq = r.variants.find((v) => v.key === "hq")!;
  assert.deepEqual([hq.width, hq.height], [480, 360]);
  assert.equal(hq.url, `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  assert.equal(hq.downloadUrl, `/api/download?id=${id}&q=hq`);
});

test("maximum size is offered when it exists", async () => {
  const id = "aaaaaaaaaa2";
  mockFetch((url) => (url.includes("oembed") ? notFound() : jpegResponse(url.includes("maxres") ? 1280 : 320, url.includes("maxres") ? 720 : 180, 200)));
  const r = await getYouTubeThumbnails(id, canon(id));
  assert.equal(r.variants[0].key, "maxres");
  assert.equal(r.variants[0].quality, "Maximum Available");
  assert.equal(r.title, undefined); // oEmbed failure is not fatal
});

test("YouTube's 120x90 placeholder is not offered for non-default sizes", async () => {
  const id = "aaaaaaaaaa3";
  mockFetch((url) => (url.includes("oembed") ? notFound() : jpegResponse(120, 90, 200)));
  const r = await getYouTubeThumbnails(id, canon(id));
  assert.deepEqual(r.variants.map((v) => v.key), ["default"]);
});

test("no thumbnails at all -> NOT_FOUND", async () => {
  mockFetch(() => notFound());
  await assert.rejects(getYouTubeThumbnails("aaaaaaaaaa4", canon("aaaaaaaaaa4")), (e: unknown) => e instanceof ApiError && e.code === "NOT_FOUND" && e.status === 404);
});

test("network failure -> UPSTREAM", async () => {
  mockFetch(() => { throw new Error("boom"); });
  await assert.rejects(getYouTubeThumbnails("aaaaaaaaaa5", canon("aaaaaaaaaa5")), (e: unknown) => e instanceof ApiError && e.code === "UPSTREAM");
});

test("non-image content type is treated as missing", async () => {
  mockFetch((url) => (url.includes("oembed") ? notFound() : new Response("<html>", { status: 200, headers: { "content-type": "text/html" } })));
  await assert.rejects(getYouTubeThumbnails("aaaaaaaaaa6", canon("aaaaaaaaaa6")), (e: unknown) => e instanceof ApiError && e.code === "NOT_FOUND");
});

test("results are cached per video", async () => {
  const id = "aaaaaaaaaa7";
  const calls = mockFetch((url) => (url.includes("oembed") ? notFound() : jpegResponse(320, 180, 200)));
  await getYouTubeThumbnails(id, canon(id));
  const first = calls.length;
  await getYouTubeThumbnails(id, canon(id));
  assert.equal(calls.length, first);
});
