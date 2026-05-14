import { useParams } from "react-router-dom";
import { Check, Heart, Undo, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { usePlaylistSwipe } from "@/hooks/playlists";
import LoadingState from "@/components/states/LoadingState";
import AudioPlayer from "@/components/AudioPlayer";
import SwipeProgress from "@/components/SwipeProgress";
import SwipeCard from "@/components/SwipeCard";

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();
  const { item, audio, index, total, likes, dislikes, swipe, undo, isLoading } =
    usePlaylistSwipe(playlistId);

  if (isLoading || !total) return <LoadingState message="Loading tracks..." />;
  if (!item) return <div>Done!</div>;

  return (
    <div className="flex flex-col w-full max-w-2xl self-center h-screen py-6">
      <SwipeProgress likes={likes} dislikes={dislikes} total={total} />
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <SwipeCard track={item.track} />
        <div className="flex items-end gap-2">
          <IconButton icon={Undo} size="sm" onClick={undo} disabled={index <= 0} variant="yellow" />
          <IconButton icon={X} onClick={() => swipe("dislike")} variant="red" />
          <IconButton icon={Heart} onClick={() => swipe("like")} variant="green" />
          <IconButton icon={Check} size="sm" variant="blue" />
        </div>
      </div>
      <AudioPlayer audio={audio.data} isError={audio.isError} />
    </div>
  );
};

export default PlaylistSwipePage;
