import type { SpotifyPlaylistTrack } from "@/types/api";
import React from "react";

type TrackCardProps = {
  track: SpotifyPlaylistTrack;
};

const TrackCard = ({ track }: TrackCardProps) => {
  const coverUrl = track.track.album.images.at(0)?.url;
  const artistList = track.track.artists.map((t) => t.name).join(", ");
  return (
    <div className="flex flex-col gap-3 w-64 p-4 bg-sp-gray border-2 border-sp-gray-light rounded-xl overflow-hidden">
      <img
        className="aspect-square object-cover w-full rounded-sm"
        src={coverUrl}
        alt={`${track.track.name} cover`}
      />
      <div className="text-left truncate whitespace-nowrap">
        <p className="font-medium">{track.track.name}</p>
        <p className="text-muted">{artistList}</p>
      </div>
    </div>
  );
};

export default TrackCard;
