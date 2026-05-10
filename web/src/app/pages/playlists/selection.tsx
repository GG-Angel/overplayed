import { usePlaylists } from "@/hooks/playlists";
import type { SpotifyPlaylist } from "@/types/api";
import { ArrowUpRight } from "lucide-react";

// type CardProps = {
//   children?: ReactNode;
// };

// const Card = ({ children }: CardProps) => {
//   return (
//     <div className="bg-sp-gray border-2 border-sp-gray-light shadow-lg rounded-xl gap-4 px-4 py-3">
//       {children}
//     </div>
//   );
// };

type PlaylistCardProps = {
  playlist: SpotifyPlaylist;
};

const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
  const coverUrl = playlist.images?.at(-1)?.url;
  return (
    <button
      type="button"
      className="group relative flex h-32 w-full gap-4 overflow-hidden rounded-xl border-2 border-sp-gray-light bg-sp-gray px-4 py-3 text-left cursor-pointer"
    >
      {/* Blurred backdrop */}
      <img
        src={coverUrl}
        aria-hidden="true"
        draggable={false}
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-15 blur-lg"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-black/20 group-hover:to-black/40 transition-colors" />

      {/* Cover */}
      <img
        src={coverUrl}
        alt={`${playlist.name} cover`}
        loading="lazy"
        className="z-10 aspect-square h-full shrink-0 rounded-sm bg-sp-black object-cover text-transparent transition-transform"
      />

      {/* Text + icon */}
      <div className="z-10 flex w-full flex-col justify-between overflow-hidden">
        <ArrowUpRight className="origin-top-right self-end transition group-hover:scale-125 group-hover:text-accent" />
        <div>
          <p className="truncate font-semibold text-text-h">{playlist.name}</p>
          <p className="truncate text-muted">{playlist.tracks.total} tracks</p>
        </div>
      </div>
    </button>
  );
};

const PlaylistSelection = () => {
  const { data: playlists } = usePlaylists();

  return (
    <>
      <p className="text-4xl text-center font-medium mb-4">Select a Playlist</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
        {playlists && playlists.map((p) => <PlaylistCard key={p.id} playlist={p} />)}
      </div>
    </>
  );
};

export default PlaylistSelection;
