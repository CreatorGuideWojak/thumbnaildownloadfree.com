import assert from "node:assert/strict";
import { test } from "node:test";
import { detectPlatform, parseMediaUrl } from "@/lib/validate";

const ID = "dQw4w9WgXcQ";

function ok(input: string) {
  const r = parseMediaUrl(input);
  assert.equal(r.ok, true, `expected ${input} to parse`);
  return r.ok ? r.target : (undefined as never);
}
function bad(input: unknown) {
  const r = parseMediaUrl(input);
  assert.equal(r.ok, false, `expected ${String(input)} to be rejected`);
  return r.ok ? (undefined as never) : r;
}

test("YouTube watch, youtu.be, shorts, embed, live and mobile links", () => {
  for (const u of [
    `https://www.youtube.com/watch?v=${ID}&t=10s&list=PL1`,
    `youtube.com/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/shorts/${ID}?feature=share`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}`,
  ]) {
    const t = ok(u);
    assert.equal(t.platform, "youtube");
    assert.equal(t.id, ID);
    assert.equal(t.canonicalUrl, `https://www.youtube.com/watch?v=${ID}`);
  }
});

test("Instagram post, reel and username-prefixed links", () => {
  assert.deepEqual(ok("https://www.instagram.com/p/CxYz123AbC/"), {
    platform: "instagram", id: "CxYz123AbC", kind: "p", canonicalUrl: "https://www.instagram.com/p/CxYz123AbC/",
  });
  assert.equal(ok("https://instagram.com/reel/CxYz123AbC/?igsh=1").platform, "instagram");
  assert.equal(ok("https://www.instagram.com/someone/reel/CxYz123AbC/").platform, "instagram");
});

test("empty and non-string input", () => {
  assert.equal(bad("").code, "EMPTY");
  assert.equal(bad("   ").code, "EMPTY");
  assert.equal(bad(undefined).code, "BAD_REQUEST");
  assert.equal(bad(42).code, "BAD_REQUEST");
});

test("malformed URLs", () => {
  for (const u of ["not a url", "https://", "javascript:alert(1)", "ftp://youtube.com/watch?v=" + ID, "https://exa mple.com"]) {
    assert.equal(bad(u).code, "INVALID_URL", u);
  }
});

test("unsupported domains, including lookalikes and internal hosts", () => {
  for (const u of [
    "https://example.com/watch?v=" + ID,
    "https://youtube.com.evil.com/watch?v=" + ID,
    "https://evilyoutube.com/watch?v=" + ID,
    "http://localhost:3000/x",
    "http://169.254.169.254/latest/meta-data",
    "https://tiktok.com/@x/video/1",
  ]) {
    assert.ok(["UNSUPPORTED_HOST", "INVALID_URL"].includes(bad(u).code), u);
  }
});

test("credentials and custom ports are rejected", () => {
  assert.equal(bad(`https://user:pw@www.youtube.com/watch?v=${ID}`).code, "INVALID_URL");
  assert.equal(bad(`https://www.youtube.com:8443/watch?v=${ID}`).code, "INVALID_URL");
});

test("supported host but unsupported format", () => {
  for (const u of [
    "https://www.youtube.com/playlist?list=PL123",
    "https://www.youtube.com/@channel",
    `https://www.youtube.com/watch?v=short`,
    "https://www.youtube.com/watch",
    "https://www.instagram.com/someone/",
    "https://www.instagram.com/stories/someone/123/",
  ]) {
    const r = bad(u);
    assert.equal(r.code, "UNSUPPORTED_PATH", u);
    assert.equal(r.message, "This URL format is not currently supported.");
  }
});

test("over-long input is rejected", () => {
  assert.equal(bad("https://www.youtube.com/watch?v=" + "a".repeat(3000)).code, "TOO_LONG");
});

test("detectPlatform", () => {
  assert.equal(detectPlatform("youtu.be/x"), "youtube");
  assert.equal(detectPlatform("https://instagram.com/p/abc"), "instagram");
  assert.equal(detectPlatform("https://example.com"), null);
  assert.equal(detectPlatform(""), null);
});

test("invalid-input message matches the spec", () => {
  assert.equal(bad("").message, "Please enter a valid YouTube or Instagram URL.");
});
