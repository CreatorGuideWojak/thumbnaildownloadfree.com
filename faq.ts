export type Faq = { id: string; q: string; a: string };

export const FAQ: Faq[] = [
  {
    id: "how-do-i-download-a-youtube-thumbnail",
    q: "How do I download a YouTube thumbnail?",
    a: "Copy the video URL, paste it above, press Get Thumbnail, then press Download Thumbnail. You can also copy the direct image URL instead.",
  },
  {
    id: "which-youtube-links-work",
    q: "Which YouTube links work?",
    a: "Standard watch links (youtube.com/watch?v=…), youtu.be short links, Shorts, live streams and embed links. Channel, playlist and search pages don't have a single thumbnail, so they aren't supported.",
  },
  {
    id: "does-this-download-4k-thumbnails",
    q: "Does this download 4K thumbnails?",
    a: "No. YouTube doesn't generate a 4K thumbnail for any video — the largest size it publishes is 1280×720 (\"maxresdefault\"), and only some videos have that size. We show exactly what YouTube has actually generated.",
  },
  {
    id: "why-is-the-maximum-resolution-missing-for-some-videos",
    q: "Why is the maximum resolution missing for some videos?",
    a: "YouTube only generates the 1280×720 version for some videos. We check each size and only list the ones YouTube actually serves — never a stretched placeholder.",
  },
  {
    id: "can-i-download-instagram-thumbnails",
    q: "Can I download Instagram thumbnails?",
    a: "Not currently. Instagram doesn't provide a reliable public way to fetch a post's image outside its own app or embed. For public posts and reels we show a preview using Instagram's own embed, with a link to open the original.",
  },
  {
    id: "why-can-t-you-download-instagram-thumbnails-the-way-youtube-",
    q: "Why can't you download Instagram thumbnails the way YouTube's are?",
    a: "YouTube publishes thumbnail images at fixed, public URLs. Instagram doesn't offer an equivalent for outside apps, and its official embed API no longer returns one either. Building a downloader around bypassing that would mean scraping or circumventing Instagram's platform protections, which we won't do.",
  },
  {
    id: "does-it-work-for-private-or-unlisted-content",
    q: "Does it work for private or unlisted content?",
    a: "Private accounts and private videos are never accessed. Unlisted YouTube videos have public thumbnail URLs, but only someone who already has the link can request them.",
  },
  {
    id: "do-you-store-the-links-or-images",
    q: "Do you store the links or images?",
    a: "No. Links are processed in memory to fetch the thumbnail, and images are streamed straight through without being saved. See the Privacy Policy for details.",
  },
  {
    id: "can-i-use-a-downloaded-thumbnail-commercially",
    q: "Can I use a downloaded thumbnail commercially?",
    a: "Thumbnails belong to their creators. Download only what you have permission to use, for example your own videos or content under a licence that allows reuse.",
  },
];
