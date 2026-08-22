import TrackCard from "@/components/playlist/TrackCard";
import MessageState from "@/components/states/MessageState";
import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import ToggleCard from "@/components/ui/ToggleCard";
import Metric from "@/components/ui/Metric";
import Page from "@/components/layout/Page";
import { KAOMOJIS, LIKED_SONGS_PLAYLIST_ID } from "@/lib/constants";
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
        actions={[
          { label: "Return Home", icon: Home, variant: "secondary", onClick: navigateHome },
          { label: "Swipe Tracks", icon: Play, variant: "primary", onClick: navigateToSwipe },
        ]}
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
        actions={[
          { label: "Keep Swiping", icon: Undo2, variant: "secondary", onClick: navigateToSwipe },
          { label: "Return Home", icon: Home, variant: "primary", onClick: navigateHome },
        ]}
      />
    );
  }

  return (
    <Page width="4xl" className="py-2 pb-32">
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
        <ToggleCard
          title="Back up removed tracks?"
          enabled={options.backup_enabled}
          onToggle={toggleBackup}
          whenEnabled="Saves removed tracks to a new playlist."
          whenDisabled="Removed tracks will be lost permanently."
          warnWhen="disabled"
        />
        {playlist.id !== LIKED_SONGS_PLAYLIST_ID && (
          <ToggleCard
            title="Remove from liked songs?"
            enabled={options.remove_from_likes}
            onToggle={toggleRemoveFromLikes}
            whenEnabled="Tracks will also be removed from liked songs."
            whenDisabled="Tracks will only be removed from the current playlist."
            warnWhen="enabled"
          />
        )}
      </div>
      <div className="flex flex-col *:flex-1 sm:*:flex-none xs:flex-row-reverse sm:justify-start gap-3">
        <Button icon={Trash2} variant="primary" onClick={navigateToSubmit}>
          Delete Tracks
        </Button>
        <Button icon={Undo2} variant="secondary" onClick={navigateToSwipe}>
          Keep Swiping
        </Button>
      </div>
    </Page>
  );
};

export default ReviewSwipesPage;
