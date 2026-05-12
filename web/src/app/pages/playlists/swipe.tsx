import { useParams } from "react-router-dom";
import TrackCard from "@/components/TrackCard";
import { Check, Heart, Undo, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { usePlaylistSwipe } from "@/hooks/playlists";
import LoadingState from "@/components/states/LoadingState";

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();
  const { currentItem, swipe, undo, isLoading, index } = usePlaylistSwipe(playlistId);

  if (isLoading) return <LoadingState />;
  if (!currentItem) return <div>Done!</div>;

  return (
    <div>
      <TrackCard track={currentItem.track} />
      <div className="flex items-end gap-2">
        <IconButton icon={Undo} size="sm" onClick={undo} disabled={index <= 0} intent="undo" />
        <IconButton icon={X} onClick={() => swipe("dislike")} intent="dislike" />
        <IconButton icon={Heart} onClick={() => swipe("like")} intent="like" />
        <IconButton icon={Check} size="sm" intent="finish" />
      </div>
    </div>
  );
};

export default PlaylistSwipePage;
