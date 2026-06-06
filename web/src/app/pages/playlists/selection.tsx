import PlaylistCard from "@/features/playlist/components/PlaylistCard";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { useUserPlaylists } from "@/features/playlist/api/get-playlists";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

const DEFAULT_SEARCH_QUERY = "";

const SelectionPage = () => {
  const { data: playlists, isLoading } = useUserPlaylists();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(DEFAULT_SEARCH_QUERY);

  const searchedPlaylists = useMemo(() => {
    if (!playlists) return [];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return playlists.filter((p) => p.name.toLowerCase().includes(normalizedQuery));
  }, [playlists, searchQuery]);

  if (isLoading) return <LoadingState message="Loading playlists..." />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tighter font-bold text-center">
        Select a Playlist
      </h1>
      <div className="flex items-center gap-2 bg-card border-card-border focus-within:border-muted-foreground border-2 py-2 px-3 rounded-md">
        <Search className="text-muted-foreground" />
        <input
          className="w-full outline-none"
          placeholder="Search for a playlist"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 pb-4">
        {searchedPlaylists.map((p) => (
          <PlaylistCard
            key={p.id}
            playlist={p}
            onClick={(playlistId) => navigate(`${playlistId}/swipe`)}
          />
        ))}
      </div>
    </div>
  );
};

export default SelectionPage;
