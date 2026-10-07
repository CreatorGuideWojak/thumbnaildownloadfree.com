/** Minimal JPEG header (SOI + SOF0 + EOI) that carries a width/height. Enough for header parsing. */
export function fakeJpeg(width: number, height: number, padTo = 0): Uint8Array {
  const sof = [0xff, 0xc0, 0x00, 0x0b, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x01, 0x01, 0x11, 0x00];
  const bytes = [0xff, 0xd8, ...sof, 0xff, 0xd9];
  while (bytes.length < padTo) bytes.push(0);
  return new Uint8Array(bytes);
}

export type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

/** Replaces global fetch for one test. Returns the list of URLs requested. */
export function mockFetch(handler: Handler): string[] {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push(url);
    return handler(url, init);
  }) as typeof fetch;
  return calls;
}

export const jpegResponse = (w: number, h: number, status = 200) =>
  new Response(fakeJpeg(w, h).buffer as ArrayBuffer, { status, headers: { "content-type": "image/jpeg" } });

export const notFound = () => new Response("", { status: 404 });
