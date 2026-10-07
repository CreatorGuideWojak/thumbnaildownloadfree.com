import Landing from "@/components/Landing";
import { FAQ } from "@/lib/faq";
import { pageMetadata } from "@/lib/seo";

const path = "/youtube-thumbnail-downloader";

export const metadata = pageMetadata({
  title: "YouTube Thumbnail Downloader - Download HD Thumbnails",
  description: "Download the thumbnail of any public YouTube video, Short or live stream in every available size, up to 1280×720 HD. Free, no sign-up.",
  absoluteTitle: true,
  path,
});

export default function Page() {
  return (
    <Landing
      path={path}
      crumb="YouTube"
      platform="youtube"
      h1="YouTube Thumbnail Downloader"
      intro="Paste a video, Short or live stream link and get the thumbnail as a JPEG, up to 1280×720 HD when the video has one."
      sections={[
        { heading: "Only real sizes", body: "We check YouTube for each size and list the ones that actually exist, so you never download a stretched placeholder." },
        { heading: "Links that work", body: "youtube.com/watch, youtu.be, Shorts, live and embed links. Unlisted videos work if you have the link; private videos are never accessed." },
      ]}
      faq={[FAQ[0], FAQ[1], FAQ[2], FAQ[3], FAQ[6], FAQ[8]]}
    />
  );
}
