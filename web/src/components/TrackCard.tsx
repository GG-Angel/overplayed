import type { Track } from "@/lib/types";

type TrackCardProps = {
  track: Track;
};

const TrackCard = ({ track }: TrackCardProps) => {
  const coverUrl = track.album.images.at(0)?.url;
  const artistList = track.artists.map((t) => t.name).join(", ");

  return (
    <div className="flex flex-col gap-3 w-64 p-4 select-none bg-card text-card-foreground border-2 border-card-border rounded-xl overflow-hidden">
      <img
        className="aspect-square object-cover w-full rounded-sm"
        src={coverUrl}
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
    </div>
  );
};

export default TrackCard;
