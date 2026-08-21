import TrackCard from "@/components/playlist/TrackCard";
import MessageState from "@/components/states/MessageState";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Divider from "@/components/ui/Divider";
import Metric from "@/components/ui/Metric";
import { KAOMOJIS, LIKED_SONGS_PLAYLIST_ID } from "@/constants/constants";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import useConfetti from "@/hooks/useConfetti";
import { cn, formatCount, pluralize } from "@/lib/utils";
import { Home, Play, Trash2, Undo2 } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ReviewSwipesPage = () => {
  const { playlist, session, options, setOptions } = useSwipeContext();
  const navigate = useNavigate();

  const toggleBackup = useCallback(
    () => setOptions((prev) => ({ ...prev, backup_enabled: !prev.backup_enabled })),
    [setOptions]
  );

  const toggleRemoveFromLikes = useCallback(
    () => setOptions((prev) => ({ ...prev, remove_from_likes: !prev.remove_from_likes })),
    [setOptions]
  );

  const navigateHome = () => navigate("/", { replace: true });
  const navigateToSwipe = () => navigate("..");
  const navigateToSubmit = () => navigate("../submit");

  useConfetti({ enabled: session.swipes.length > 0 && session.dislikes.length === 0 });

  if (session.swipes.length === 0) {
    return (
      <MessageState
        kaomoji={KAOMOJIS.uncertain}
        title="No Tracks Swiped"
        subtitle={<p>You haven't swiped on any tracks...</p>}
        actions={
          <>
            <Button icon={<Home className="size-4" />} variant="secondary" onClick={navigateHome}>
              Return Home
            </Button>
            <Button icon={<Play className="size-4" />} variant="primary" onClick={navigateToSwipe}>
              Swipe Tracks
            </Button>
          </>
        }
      />
    );
  }

  if (session.dislikes.length === 0) {
    return (
      <MessageState
        kaomoji={KAOMOJIS.proud}
        title="Nothing to Remove!"
        tone="positive"
        subtitle={
          <>
            <p>You kept every track, so your playlist stays as is.</p>
            <p className="text-sm text-muted">(your playlist must be really good)</p>
          </>
        }
        actions={
          <>
            <Button
              icon={<Undo2 className="size-4" />}
              variant="secondary"
              onClick={navigateToSwipe}
            >
              Keep Swiping
            </Button>
            <Button icon={<Home className="size-4" />} variant="primary" onClick={navigateHome}>
              Return Home
            </Button>
          </>
        }
      />
    );
  }

  return (
    <main className="flex flex-col gap-6 py-2 w-full max-w-4xl self-center pb-32">
      <h1 className="text-center">Review Swipes</h1>
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Metric
          amount={formatCount(session.dislikes.length)}
          label={pluralize("Dislike", session.dislikes.length)}
          tone="negative"
        />
        <Metric
          amount={formatCount(session.likes.length)}
          label={pluralize("Like", session.likes.length)}
          tone="positive"
        />
      </div>
      <div className="flex flex-col gap-3">
        <h3>The following tracks will be removed:</h3>
        <div className="relative">
          <div
            className={cn(
              "max-h-56 sm:max-h-124 overflow-y-auto snap-y",
              session.dislikes.length > 5 && "pb-18"
            )}
          >
            <div className="flex flex-col space-y-3">
              {session.dislikes.map((track) => (
                <TrackCard
                  key={track.uri}
                  track={track}
                  orientation="horizontal"
                  className="snap-start"
                />
              ))}
            </div>
          </div>
          {session.dislikes.length > 5 && (
            <div className="absolute bottom-0 left-0 w-full h-18 bg-linear-to-t from-background to-transparent pointer-events-none" />
          )}
        </div>
      </div>
      <Divider />
      <div className="flex flex-col gap-3">
        <h3>Options</h3>
        <Card
          className="flex justify-between items-center gap-4 pr-6 py-3 cursor-pointer select-none"
          onClick={toggleBackup}
        >
          <div>
            <p>Back up removed tracks?</p>
            {options.backup_enabled ? (
              <p className="text-sm text-muted">Saves removed tracks to a new playlist.</p>
            ) : (
              <p className="text-sm text-destructive">Removed tracks will be lost permanently.</p>
            )}
          </div>
          <Checkbox enabled={options.backup_enabled} onEnabledChange={undefined} />
        </Card>
        {playlist.id !== LIKED_SONGS_PLAYLIST_ID && (
          <Card
            className="flex justify-between items-center gap-4 pr-6 py-3 cursor-pointer select-none"
            onClick={toggleRemoveFromLikes}
          >
            <div>
              <p>Remove from liked songs?</p>
              {options.remove_from_likes ? (
                <p className="text-sm text-destructive">
                  Tracks will also be removed from liked songs.
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Tracks will only be removed from the current playlist.
                </p>
              )}
            </div>
            <Checkbox enabled={options.remove_from_likes} onEnabledChange={undefined} />
          </Card>
        )}
      </div>
      <div className="flex flex-col *:flex-1 sm:*:flex-none xs:flex-row-reverse sm:justify-start gap-3">
        <Button icon={<Trash2 className="size-4" />} variant="primary" onClick={navigateToSubmit}>
          Delete Tracks
        </Button>
        <Button icon={<Undo2 className="size-4" />} variant="secondary" onClick={navigateToSwipe}>
          Keep Swiping
        </Button>
      </div>
    </main>
  );
};

export default ReviewSwipesPage;
