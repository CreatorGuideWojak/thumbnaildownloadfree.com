import assert from "node:assert/strict";
import { test } from "node:test";
import { readJpegSize } from "@/lib/jpeg";
import { fakeJpeg } from "./helpers";

// A real 64×36 JPEG generated with the sharp image library.
const REAL_64x36 =
  "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAkAEADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAYH/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AgAE82EAAAAAAAAAAAAAAAAAAAAAB/9k=";

test("reads size from a real JPEG", () => {
  assert.deepEqual(readJpegSize(Uint8Array.from(Buffer.from(REAL_64x36, "base64"))), { width: 64, height: 36 });
});

test("reads size from a minimal header", () => {
  assert.deepEqual(readJpegSize(fakeJpeg(1280, 720)), { width: 1280, height: 720 });
});

test("returns null for non-JPEG, truncated and empty data", () => {
  assert.equal(readJpegSize(new Uint8Array([1, 2, 3, 4, 5])), null);
  assert.equal(readJpegSize(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])), null);
  assert.equal(readJpegSize(new Uint8Array(0)), null);
});
