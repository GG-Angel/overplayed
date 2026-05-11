import type { SpotifyPlaylistTrack } from "@/types/api";

type TrackCardProps = {
  track: SpotifyPlaylistTrack;
};

const TrackCard = ({ track }: TrackCardProps) => {
  const coverUrl = track.track.album.images.at(0)?.url;
  const artistList = track.track.artists.map((t) => t.name).join(", ");
  return (
    <div className="flex flex-col gap-3 w-64 p-4 select-none bg-sp-gray border-2 border-sp-gray-light rounded-xl overflow-hidden">
      <img
        className="aspect-square object-cover w-full rounded-sm"
        src={coverUrl}
        alt={`${track.track.name} cover`}
        draggable={false}
      />
      <div className="text-left whitespace-nowrap">
        <a
          href={track.track.external_urls.spotify}
          className="font-medium truncate hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {track.track.name}
        </a>
        <p className="text-muted truncate text-sm">{artistList}</p>
      </div>
    </div>
  );
};

export default TrackCard;
