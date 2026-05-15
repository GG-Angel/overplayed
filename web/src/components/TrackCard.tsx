import type { Track } from "@/lib/types";
import Card from "./ui/Card";
import { extractImageUrl } from "@/lib/utils";

type TrackCardProps = {
  track: Track;
};

const TrackCard = ({ track }: TrackCardProps) => {
  const coverUrl = extractImageUrl(track.album.images, "lg");
  const artistList = track.artists.map((t) => t.name).join(", ");

  return (
    <Card padding="square" className="flex flex-col gap-3 w-64 sm:w-72 lg:w-84 select-none">
      <img
        src={coverUrl}
        className="aspect-square object-cover w-full rounded-sm"
        alt={`${track.name} cover`}
        draggable={false}
      />
      <div className="text-left whitespace-nowrap truncate">
        <a
          href={track.external_urls.spotify}
          className="font-medium hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {track.name}
        </a>
        <p className="text-muted-foreground text-sm">{artistList}</p>
      </div>
    </Card>
  );
};

export default TrackCard;
