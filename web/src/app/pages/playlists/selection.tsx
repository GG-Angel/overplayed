import { cn } from "@/lib/utils";
import PlaylistCard from "@/features/playlist/components/PlaylistCard";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { useUserPlaylists } from "@/features/playlist/api/get-playlists";
import { useCallback, useMemo, useState, type ComponentType } from "react";
import MessageState from "@/components/states/MessageState";
import Dropdown from "@/components/ui/dropdown/Dropdown";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import DropdownMenuDivider from "@/components/ui/dropdown/DropdownMenuDivider";
import DropdownMenuSection from "@/components/ui/dropdown/DropdownMenuSection";
import { kaomojis } from "@/lib/kaomoji";
import PlaylistRow from "@/features/playlist/components/PlaylistRow";
import type { PlaylistDisplayProps } from "@/features/playlist/components/props";
import {
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  List,
  Menu,
  Rows,
  Search,
  type LucideIcon,
} from "lucide-react";
import PlaylistCover from "@/features/playlist/components/PlaylistCover";
import DropdownMenuButton from "@/components/ui/dropdown/DropdownMenuButton";

type PlaylistSortKey = "alphabetical" | "tracks";
type PlaylistSortOrder = "ascending" | "descending";
type PlaylistLayout = "text" | "card" | "cover";

const sortConfig: Record<PlaylistSortKey, { label: string }> = {
  tracks: { label: "Track count" },
  alphabetical: { label: "Alphabetical" },
} as const;

const layoutConfig: Record<
  PlaylistLayout,
  { icon: LucideIcon; component: ComponentType<PlaylistDisplayProps>; containerClassName: string }
> = {
  text: {
    icon: Menu,
    component: PlaylistRow,
    containerClassName: "flex flex-col gap-1",
  },
  card: {
    icon: Rows,
    component: PlaylistCard,
    containerClassName: "grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6",
  },
  cover: {
    icon: LayoutGrid,
    component: PlaylistCover,
    containerClassName: "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4",
  },
};

const SelectionPage = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortKey, setSortKey] = useState<PlaylistSortKey>("tracks");
  const [sortOrder, setSortOrder] = useState<PlaylistSortOrder>("descending");
  const [layout, setLayout] = useState<PlaylistLayout>("card");
  const { data: playlists, isLoading } = useUserPlaylists();
  const navigate = useNavigate();

  const SortIcon = sortOrder === "ascending" ? ArrowUp : ArrowDown;
  const Playlist = layoutConfig[layout].component;

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

  const toggleSortOrder = useCallback(
    () => setSortOrder((prev) => (prev === "ascending" ? "descending" : "ascending")),
    []
  );

  if (isLoading) return <LoadingState message="Loading playlists..." />;

  return (
    <div className="flex flex-col h-full gap-6">
      <h1 className="text-center">Select a Playlist</h1>
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
        {/* TODO: Make responsive on mobile */}
        {/* TODO: use this same menu style for the user menu */}
        <Dropdown
          align="right"
          className="justify-self-end h-full flex items-center"
          trigger={({ toggle }) => (
            <button
              className="flex items-center gap-3 cursor-pointer font-medium hover:scale-105 active:scale-100 text-muted-foreground hover:text-foreground transition-all"
              onClick={toggle}
            >
              {sortConfig[sortKey].label}
              <List />
            </button>
          )}
        >
          <DropdownMenu className="w-64">
            <DropdownMenuSection label="Sort by" />
            {(Object.keys(sortConfig) as PlaylistSortKey[]).map((option) => {
              const isSelected = option === sortKey;
              return (
                <DropdownMenuButton
                  key={option}
                  onClick={isSelected ? toggleSortOrder : () => setSortKey(option)}
                  className={cn("justify-between", isSelected && "text-primary")}
                >
                  {sortConfig[option].label}
                  {isSelected && <SortIcon className="shrink-0" />}
                </DropdownMenuButton>
              );
            })}
            <DropdownMenuDivider />
            <DropdownMenuSection label="View as" />
            <div className="grid auto-cols-fr grid-flow-col bg-background rounded-lg p-1 gap-1">
              {(Object.keys(layoutConfig) as PlaylistLayout[]).map((option) => {
                const Icon = layoutConfig[option].icon;
                const isSelected = option === layout;
                return (
                  <button
                    className={cn(
                      "flex justify-center text-muted-foreground p-1 rounded-sm cursor-pointer hover:bg-card",
                      isSelected && "text-accent bg-card"
                    )}
                    onClick={() => setLayout(option)}
                  >
                    <Icon />
                  </button>
                );
              })}
            </div>
          </DropdownMenu>
        </Dropdown>
      </div>
      {sortedPlaylists.length > 0 ? (
        <div className={cn("pb-4", layoutConfig[layout].containerClassName)}>
          {sortedPlaylists.map((p) => (
            <Playlist
              key={p.id}
              playlist={p}
              onClick={(playlistId) => navigate(`${playlistId}/swipe`)}
            />
          ))}
        </div>
      ) : (
        <MessageState kaomoji={kaomojis.uncertain} title="No playlists found" />
      )}
    </div>
  );
};

export default SelectionPage;
