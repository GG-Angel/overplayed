import { useParams } from "react-router-dom";
import TrackCard from "@/components/TrackCard";
import { Check, Heart, Undo, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { usePlaylistSwipe } from "@/hooks/playlists";
import LoadingState from "@/components/states/LoadingState";
import AudioPlayer from "@/components/AudioPlayer";

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();
  const { currentItem, currentAudio, swipe, undo, isLoading, index } = usePlaylistSwipe(playlistId);

  if (isLoading) return <LoadingState />;
  if (!currentItem) return <div>Done!</div>;

  return (
    <div>
      <TrackCard track={currentItem.track} />
      <div className="flex items-end gap-2">
        <IconButton icon={Undo} size="sm" onClick={undo} disabled={index <= 0} variant="yellow" />
        <IconButton icon={X} onClick={() => swipe("dislike")} variant="red" />
        <IconButton icon={Heart} onClick={() => swipe("like")} variant="green" />
        <IconButton icon={Check} size="sm" variant="blue" />
      </div>
      <AudioPlayer audio={currentAudio.data} isError={currentAudio.isError} />
    </div>
  );
};

export default PlaylistSwipePage;
