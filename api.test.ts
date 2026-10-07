import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { GET as download } from "@/app/api/download/route";
import { POST as lookup } from "@/app/api/thumbnail/route";
import { fakeJpeg, jpegResponse, mockFetch, notFound } from "./helpers";

let ipCounter = 0;
const freshIp = () => `10.1.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

function post(body: unknown, opts: { ip?: string; origin?: string; contentType?: string; raw?: string } = {}) {
  return new NextRequest("http://localhost:3000/api/thumbnail", {
    method: "POST",
    headers: {
      "content-type": opts.contentType ?? "application/json",
      "x-forwarded-for": opts.ip ?? freshIp(),
      host: "localhost:3000",
      ...(opts.origin ? { origin: opts.origin } : {}),
    },
    body: opts.raw ?? JSON.stringify(body),
  });
}

const get = (qs: string, ip = freshIp()) =>
  new NextRequest(`http://localhost:3000/api/download?${qs}`, { headers: { "x-forwarded-for": ip } });

const errorOf = async (res: Response) => ((await res.json()) as { error: { code: string; message: string } }).error;

test("lookup: empty, malformed, unsupported domain -> 400 with the spec message", async () => {
  for (const url of ["", "not a url", "https://example.com/x", undefined]) {
    const res = await lookup(post({ url }));
    assert.equal(res.status, 400);
    assert.equal((await errorOf(res)).message, "Please enter a valid YouTube or Instagram URL.");
  }
});

test("lookup: unsupported format on a supported host", async () => {
  const res = await lookup(post({ url: "https://www.youtube.com/@somechannel" }));
  assert.equal(res.status, 400);
  assert.equal((await errorOf(res)).message, "This URL format is not currently supported.");
});

test("lookup: bad content type, bad JSON, oversized body", async () => {
  assert.equal((await lookup(post(null, { contentType: "text/plain", raw: "x" }))).status, 415);
  assert.equal((await lookup(post(null, { raw: "{not json" }))).status, 400);
  assert.equal((await lookup(post(null, { raw: JSON.stringify({ url: "a".repeat(5000) }) }))).status, 413);
});

test("lookup: cross-origin request is refused", async () => {
  const res = await lookup(post({ url: "https://youtu.be/bbbbbbbbbb1" }, { origin: "https://evil.example" }));
  assert.equal(res.status, 403);
});

test("lookup: valid YouTube Shorts URL succeeds and lists only existing sizes", async () => {
  mockFetch((url) => {
    if (url.includes("oembed")) return Response.json({ title: "A Short" });
    if (url.includes("maxres")) return notFound();
    return jpegResponse(url.includes("mq") ? 320 : 480, url.includes("mq") ? 180 : 360, 206);
  });
  const res = await lookup(post({ url: "https://www.youtube.com/shorts/bbbbbbbbbb2?feature=share" }));
  assert.equal(res.status, 200);
  const body = (await res.json()) as { platform: string; variants: { key: string }[] };
  assert.equal(body.platform, "youtube");
  assert.ok(!body.variants.some((v) => v.key === "maxres"));
  assert.ok(body.variants.length >= 3);
});

test("lookup: unavailable thumbnail -> 404 with the spec message", async () => {
  mockFetch(() => notFound());
  const res = await lookup(post({ url: "https://youtu.be/bbbbbbbbbb3" }));
  assert.equal(res.status, 404);
  assert.equal((await errorOf(res)).message, "We couldn't retrieve a thumbnail from this URL.");
});

test("lookup: upstream failure never leaks internals", async () => {
  mockFetch(() => { throw new Error("secret stack detail"); });
  const res = await lookup(post({ url: "https://youtu.be/bbbbbbbbbb4" }));
  const text = JSON.stringify(await res.json());
  assert.ok(!text.includes("secret"), text);
  assert.ok(!text.includes("stack"), text);
});

test("lookup: Instagram public post -> preview only, no image data even if Meta sends some", async () => {
  mockFetch(() => Response.json({ html: "<blockquote/>", thumbnail_url: "https://scontent.cdninstagram.com/x.jpg", author_name: "someone", title: "secret caption" }));
  const res = await lookup(post({ url: "https://www.instagram.com/p/CxYz123AbD/" }));
  assert.equal(res.status, 200);
  const raw = await res.text();
  const body = JSON.parse(raw) as { variants: unknown[]; embedUrl: string };
  assert.deepEqual(body.variants, []);
  assert.equal(body.embedUrl, "https://www.instagram.com/p/CxYz123AbD/embed/");
  assert.ok(!raw.includes("cdninstagram") && !raw.includes("secret caption") && !raw.includes("someone"));
});

test("lookup: Instagram private/unavailable -> spec message", async () => {
  mockFetch(() => Response.json({ error: { code: 100, message: "Invalid" } }, { status: 400 }));
  const res = await lookup(post({ url: "https://www.instagram.com/reel/CxYz123AbE/" }));
  assert.equal(res.status, 404);
  assert.equal((await errorOf(res)).message, "This Instagram content may be private or unavailable.");
});

test("lookup: Instagram rate-limited upstream is reported as unavailable, not private", async () => {
  mockFetch(() => new Response("", { status: 429 }));
  const res = await lookup(post({ url: "https://www.instagram.com/p/CxYz123AbF/" }));
  assert.equal(res.status, 503);
  assert.equal((await errorOf(res)).code, "UPSTREAM");
});

test("lookup: rate limit blocks the 21st request in a minute, other IPs unaffected", async () => {
  const ip = freshIp();
  mockFetch(() => notFound());
  const codes: number[] = [];
  for (let i = 0; i < 21; i++) codes.push((await lookup(post({ url: "https://youtu.be/bbbbbbbbbb5" }, { ip }))).status);
  assert.deepEqual(codes.slice(0, 20).filter((c) => c === 429), []);
  assert.equal(codes[20], 429);
  const blocked = await lookup(post({ url: "" }, { ip }));
  assert.equal(blocked.headers.get("retry-after") !== null, true);
  assert.equal((await errorOf(blocked)).message, "Too many requests. Please try again shortly.");
  assert.notEqual((await lookup(post({ url: "" }))).status, 429);
});

test("download: rejects bad id and unknown quality; ignores any URL parameter", async () => {
  const calls = mockFetch(() => jpegResponse(10, 10));
  assert.equal((await download(get("id=short&q=hq"))).status, 400);
  assert.equal((await download(get("id=cccccccccc1&q=huge"))).status, 400);
  assert.equal((await download(get("q=hq"))).status, 400);
  assert.equal((await download(get("u=" + encodeURIComponent("http://169.254.169.254/latest") + "&id=cccccccccc1&q=hq"))).status, 200);
  assert.deepEqual(calls, ["https://i.ytimg.com/vi/cccccccccc1/hqdefault.jpg"]);
});

test("download: success returns an attachment JPEG with safe headers", async () => {
  mockFetch(() => new Response(fakeJpeg(480, 360, 500).buffer as ArrayBuffer, { status: 200, headers: { "content-type": "image/jpeg" } }));
  const res = await download(get("id=cccccccccc2&q=hq"));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/jpeg");
  assert.equal(res.headers.get("content-disposition"), 'attachment; filename="youtube-cccccccccc2-hq.jpg"');
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await res.arrayBuffer()).byteLength, 500);
});

test("download: missing image, redirect, wrong type and oversize are all refused", async () => {
  mockFetch(() => notFound());
  assert.equal((await download(get("id=cccccccccc3&q=maxres"))).status, 404);

  mockFetch(() => new Response("", { status: 302, headers: { location: "http://169.254.169.254/" } }));
  assert.equal((await download(get("id=cccccccccc4&q=hq"))).status, 404);

  mockFetch(() => new Response("<html>", { status: 200, headers: { "content-type": "text/html" } }));
  assert.equal((await download(get("id=cccccccccc5&q=hq"))).status, 502);

  mockFetch(() => new Response(new ArrayBuffer(3 * 1024 * 1024), { status: 200, headers: { "content-type": "image/jpeg" } }));
  assert.equal((await download(get("id=cccccccccc6&q=hq"))).status, 413);
});

test("download: rate limit blocks the 61st request in a minute", async () => {
  mockFetch(() => jpegResponse(10, 10));
  const ip = freshIp();
  let last = 0;
  for (let i = 0; i < 61; i++) last = (await download(get("id=cccccccccc7&q=hq", ip))).status;
  assert.equal(last, 429);
});

test("lookup: a script-tag payload is rejected and never reflected back", async () => {
  const payload = "https://www.youtube.com/watch?v=<script>alert(1)</script>";
  const res = await lookup(post({ url: payload }));
  assert.equal(res.status, 400);
  const raw = await res.text();
  assert.ok(!raw.includes("<script>"), raw);
  assert.equal(JSON.parse(raw).error.message, "This URL format is not currently supported.");
});

test("download: unexpected extra query parameters are ignored, not rejected", async () => {
  mockFetch(() => jpegResponse(480, 360));
  const res = await download(get("id=cccccccccc9&q=hq&extra=whatever&debug=1"));
  assert.equal(res.status, 200);
});

test("download: an id containing path-traversal characters is rejected", async () => {
  const res = await download(get(`id=${encodeURIComponent("../../etc/passwd")}&q=hq`));
  assert.equal(res.status, 400);
});

test("download: missing quality parameter is rejected", async () => {
  const res = await download(get("id=cccccccccc0"));
  assert.equal(res.status, 400);
});

test("download: the old name= parameter is ignored; server derives the filename itself", async () => {
  const calls = mockFetch(() => jpegResponse(480, 360));
  const res = await download(get("id=cccccccccc8&q=hq&name=evil.sh"));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-disposition"), 'attachment; filename="youtube-cccccccccc8-hq.jpg"');
  assert.deepEqual(calls, ["https://i.ytimg.com/vi/cccccccccc8/hqdefault.jpg"]);
});
