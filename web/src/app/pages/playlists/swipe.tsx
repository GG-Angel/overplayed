import { useParams } from "react-router-dom";
import TrackCard from "@/features/playlists/components/TrackCard";
import { Check, Heart, Undo, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { usePlaylistSwipe } from "@/features/playlists/hooks";
import LoadingState from "@/components/states/LoadingState";
import PreviewPlayer from "@/features/previews/components/PreviewPlayer";

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();
  const { currentTrack, swipe, undo, isLoading, isFirst } = usePlaylistSwipe(playlistId);

  if (isLoading) return <LoadingState />;
  if (!currentTrack) return <div>Done!</div>;

  return (
    <div>
      <TrackCard track={currentTrack} />
      <div className="flex items-end gap-2">
        <IconButton icon={Undo} size="sm" onClick={undo} disabled={isFirst} intent="undo" />
        <IconButton icon={X} onClick={() => swipe("dislike")} intent="dislike" />
        <IconButton icon={Heart} onClick={() => swipe("like")} intent="like" />
        {/* TODO: make finish button functional */}
        <IconButton icon={Check} size="sm" intent="finish" />
      </div>
      <PreviewPlayer isrc={currentTrack.track.external_ids.isrc} />
    </div>
  );
};

export default PlaylistSwipePage;
