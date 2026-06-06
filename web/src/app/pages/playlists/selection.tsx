import PlaylistCard from "@/features/playlist/components/PlaylistCard";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { useUserPlaylists } from "@/features/playlist/api/get-playlists";
import { ArrowDown, ArrowUp, List, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import MessageState from "@/components/states/MessageState";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import useClickOutside from "@/hooks/useClickOutside";
import Divider from "@/components/ui/Divider";

type PlaylistSortKey = "alphabetical" | "tracks";
type PlaylistSortOrder = "ascending" | "descending";

const sortKeyLabels: Record<PlaylistSortKey, string> = {
  tracks: "Track count",
  alphabetical: "Alphabetical",
} as const;

const SelectionPage = () => {
  const { data: playlists, isLoading } = useUserPlaylists();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortKey, setSortKey] = useState<PlaylistSortKey>("tracks");
  const [sortOrder, setSortOrder] = useState<PlaylistSortOrder>("descending");
  const [isSortMenuVisible, setIsSortMenuVisible] = useState<boolean>(true);

  const sortContainerRef = useClickOutside<HTMLDivElement>(
    () => setIsSortMenuVisible(false),
    isSortMenuVisible
  );

  const searchedPlaylists = useMemo(() => {
    if (!playlists) return [];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return playlists.filter((p) => p.name.toLowerCase().includes(normalizedQuery));
  }, [playlists, searchQuery]);

  const sortedPlaylists = useMemo(() => {
    return [...searchedPlaylists].sort((a, b) => {
      let comparison = 0;
      if (sortKey === "alphabetical") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortKey === "tracks") {
        comparison = a.tracks.total - b.tracks.total;
      }
      return sortOrder === "descending" ? -comparison : comparison;
    });
  }, [searchedPlaylists, sortKey, sortOrder]);

  const toggleSortMenu = useCallback(() => setIsSortMenuVisible((prev) => !prev), []);
  const toggleSortOrder = useCallback(
    () => setSortOrder((prev) => (prev === "ascending" ? "descending" : "ascending")),
    []
  );

  if (isLoading) return <LoadingState message="Loading playlists..." />;

  return (
    <div className="flex flex-col h-full gap-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tighter font-bold text-center">
        Select a Playlist
      </h1>
      <div className="grid grid-cols-2 gap-6">
        {/* TODO: make input a component */}
        {/* TODO: Shrink to just icon on mobile. When active, cut off text from sort menu. */}
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
        <div className="flex flex-col items-end justify-center relative" ref={sortContainerRef}>
          <button
            className="flex items-center gap-3 text-muted-foreground cursor-pointer font-medium hover:scale-105 active:scale-100 hover:text-foreground transition-all duration-150"
            onClick={toggleSortMenu}
          >
            {sortKeyLabels[sortKey]}
            <List />
          </button>
          {/* TODO: Make responsive on mobile */}
          {/* TODO: use this same menu style for the user menu */}
          {isSortMenuVisible &&
            (() => {
              const SortIcon = sortOrder === "ascending" ? ArrowUp : ArrowDown;
              return (
                <Card
                  className="flex-col absolute top-4/3 w-full max-w-3xs z-50 shadow-lg"
                  size="xs"
                  padding="square"
                >
                  <span className="block mx-3 my-2 text-xs font-semibold text-muted-foreground">
                    Sort by
                  </span>
                  {(Object.keys(sortKeyLabels) as PlaylistSortKey[]).map((key) => {
                    const isSelectedKey = key === sortKey;
                    return (
                      <button
                        className={cn(
                          "flex justify-between items-center text-left cursor-pointer py-2 px-3 gap-2 hover:bg-card-border rounded-xs",
                          isSelectedKey ? "text-primary" : "text-foreground"
                        )}
                        key={key}
                        onClick={isSelectedKey ? toggleSortOrder : () => setSortKey(key)}
                      >
                        {sortKeyLabels[key]}
                        {isSelectedKey && <SortIcon className="shrink-0" />}
                      </button>
                    );
                  })}
                  <Divider className="my-1" />
                  <span className="block mx-3 my-2 text-xs font-semibold text-muted-foreground">
                    View as
                  </span>
                  {/* TODO: add view options (vertical cards, horizontal cards, <title track_count link_icon highlight_green_on_hover>) */}
                </Card>
              );
            })()}
        </div>
      </div>
      {sortedPlaylists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 pb-4">
          {sortedPlaylists.map((p) => (
            <PlaylistCard
              key={p.id}
              playlist={p}
              onClick={(playlistId) => navigate(`${playlistId}/swipe`)}
            />
          ))}
        </div>
      ) : (
        <MessageState kaomoji="(⁠๑﹏๑)" title="No playlists found" />
      )}
    </div>
  );
};

export default SelectionPage;
