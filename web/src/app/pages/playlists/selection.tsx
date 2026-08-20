import { cn } from "@/lib/utils";
import PlaylistCard from "@/features/playlist/components/PlaylistCard";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { usePlaylists } from "@/features/playlist/api/get-playlists";
import { useCallback, useMemo, useState, type ComponentType } from "react";
import MessageState from "@/components/states/MessageState";
import Dropdown from "@/components/ui/dropdown/Dropdown";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import DropdownMenuDivider from "@/components/ui/dropdown/DropdownMenuDivider";
import DropdownMenuSection from "@/components/ui/dropdown/DropdownMenuSection";
import { kaomojis } from "@/lib/kaomoji";
import PlaylistRow from "@/features/playlist/components/PlaylistRow";
import type { PlaylistDisplayProps } from "@/features/playlist/components/utils";
import PlaylistCover from "@/features/playlist/components/PlaylistCover";
import DropdownMenuButton from "@/components/ui/dropdown/DropdownMenuButton";
import Input from "@/components/ui/Input";
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

type PlaylistSortKey = "alphabetical" | "tracks";
type PlaylistSortOrder = "ascending" | "descending";
type PlaylistLayout = "text" | "card" | "cover";

const SORT_CONFIG: Record<PlaylistSortKey, { label: string }> = {
  tracks: { label: "Track count" },
  alphabetical: { label: "Alphabetical" },
} as const;

const LAYOUT_CONFIG: Record<
  PlaylistLayout,
  { icon: LucideIcon; component: ComponentType<PlaylistDisplayProps>; containerClassName: string }
> = {
  text: {
    icon: Menu,
    component: PlaylistRow,
    containerClassName: "flex flex-col gap-y-1.5",
  },
  card: {
    icon: Rows,
    component: PlaylistCard,
    containerClassName: "grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6",
  },
  cover: {
    icon: LayoutGrid,
    component: PlaylistCover,
    containerClassName: "grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
  },
};

const SelectionPage = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortKey, setSortKey] = useState<PlaylistSortKey>("tracks");
  const [sortOrder, setSortOrder] = useState<PlaylistSortOrder>("descending");
  const [layout, setLayout] = useState<PlaylistLayout>("card");
  const { data: playlists, isLoading } = usePlaylists();
  const navigate = useNavigate();

  const SortIcon = sortOrder === "ascending" ? ArrowUp : ArrowDown;
  const Playlist = LAYOUT_CONFIG[layout].component;

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

  return (
    <main className="flex flex-col h-full gap-6">
      <h1 className="text-center">Select a Playlist</h1>
      <div className="flex items-center justify-between gap-8">
        <Input
          className="flex-1"
          icon={Search}
          type="search"
          placeholder="Search for a playlist"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Dropdown
          align="right"
          className="justify-self-end h-full flex items-center justify-end xs:w-36 mr-4.5"
          trigger={({ toggle }) => (
            <button
              className="flex shrink-0 items-center gap-3 cursor-pointer font-medium hover:scale-105 active:scale-100 text-muted hover:text-foreground transition-all"
              onClick={toggle}
            >
              <span className="hidden xs:block">{SORT_CONFIG[sortKey].label}</span>
              <List />
            </button>
          )}
        >
          <DropdownMenu className="w-64">
            <DropdownMenuSection label="Sort by" />
            {(Object.keys(SORT_CONFIG) as PlaylistSortKey[]).map((option) => {
              const isSelected = option === sortKey;
              return (
                <DropdownMenuButton
                  key={option}
                  onClick={isSelected ? toggleSortOrder : () => setSortKey(option)}
                  className={cn("justify-between", isSelected && "text-primary")}
                >
                  {SORT_CONFIG[option].label}
                  {isSelected && <SortIcon className="shrink-0" />}
                </DropdownMenuButton>
              );
            })}
            <DropdownMenuDivider />
            <DropdownMenuSection label="View as" />
            <div className="grid auto-cols-fr grid-flow-col bg-background rounded-lg p-1 gap-1">
              {(Object.keys(LAYOUT_CONFIG) as PlaylistLayout[]).map((option) => {
                const Icon = LAYOUT_CONFIG[option].icon;
                const isSelected = option === layout;
                return (
                  <button
                    key={option}
                    className={cn(
                      "flex justify-center text-muted p-1 rounded-sm cursor-pointer hover:bg-card",
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
      {(() => {
        if (isLoading) {
          return <LoadingState message="Loading playlists..." />;
        }

        if (sortedPlaylists.length <= 0) {
          return <MessageState kaomoji={kaomojis.uncertain} title="No playlists found" />;
        }

        return (
          <section className="md:h-full md:min-h-128 md:overflow-y-scroll md:[scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-y pb-32">
            <div className={LAYOUT_CONFIG[layout].containerClassName}>
              {sortedPlaylists.map((p) => (
                <Playlist
                  key={p.id}
                  playlist={p}
                  onClick={(playlistId) => navigate(`${playlistId}/swipe`)}
                />
              ))}
            </div>
            <div className="fixed bottom-0 left-0 w-full h-32 pointer-events-none bg-linear-to-t from-background to-transparent hidden md:block z-10" />
          </section>
        );
      })()}
    </main>
  );
};

export default SelectionPage;
