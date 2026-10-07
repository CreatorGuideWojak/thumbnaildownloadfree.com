import assert from "node:assert/strict";
import { test } from "node:test";
import { rateLimit } from "@/lib/rateLimit";

test("allows up to the limit, then blocks with retryAfter", () => {
  const results = Array.from({ length: 6 }, () => rateLimit("rl-a", 5, 60_000));
  assert.deepEqual(results.map((r) => r.ok), [true, true, true, true, true, false]);
  assert.ok(results[5].retryAfter >= 1 && results[5].retryAfter <= 60);
});

test("keys are independent", () => {
  for (let i = 0; i < 5; i++) rateLimit("rl-b", 5, 60_000);
  assert.equal(rateLimit("rl-b", 5, 60_000).ok, false);
  assert.equal(rateLimit("rl-c", 5, 60_000).ok, true);
});

test("window expires", async () => {
  for (let i = 0; i < 2; i++) rateLimit("rl-d", 2, 50);
  assert.equal(rateLimit("rl-d", 2, 50).ok, false);
  await new Promise((r) => setTimeout(r, 70));
  assert.equal(rateLimit("rl-d", 2, 50).ok, true);
});
