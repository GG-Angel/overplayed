import MessageState from "@/components/states/MessageState";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import useSubmitSwipes, { SWIPE_PHASE_DESCRIPTIONS } from "@/features/swipe/hooks/useSubmitSwipes";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import useConfetti from "@/hooks/useConfetti";
import { kaomojis } from "@/lib/kaomoji";
import { openExternalUrl } from "@/lib/utils";
import { useEffect, useEffectEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const SwipeSubmitPage = () => {
  const { playlist, session } = useSwipeContext();
  const controller = useSubmitSwipes();
  const navigate = useNavigate();

  const { backupPlaylist } = controller;

  // snapshot the count before the query is invalidated for the dislike percentage
  const [totalTracksAtSubmit] = useState(() => playlist.totalTracks);

  const dislikePercentage =
    totalTracksAtSubmit > 0 ? Math.round((session.dislikes.length / totalTracksAtSubmit) * 100) : 0;

  const navigateHome = () => navigate("/", { replace: true });
  const navigateToSwipePage = () => navigate("..");

  const initialSubmit = useEffectEvent(() => {
    controller.start(); // submit on page load
  });

  useEffect(() => {
    initialSubmit();
  }, []);

  // show confetti on success
  useConfetti({ enabled: controller.isSuccess });

  if (!controller.canSubmit) {
    return (
      <MessageState
        kaomoji={kaomojis.uncertain}
        title="Invalid Submission"
        tone="negative"
        subtitle={<p>You haven't disliked any tracks...</p>}
        actions={
          <>
            <Button variant="secondary" onClick={navigateHome}>
              Return Home
            </Button>
            <Button variant="primary" onClick={navigateToSwipePage}>
              Swipe Tracks
            </Button>
          </>
        }
      />
    );
  }

  if (controller.isError) {
    return (
      <MessageState
        kaomoji={kaomojis.stressed}
        title="Submission Failed"
        tone="negative"
        subtitle={
          <>
            <p>One of the submission steps failed.</p>
            <p className="text-sm text-muted">We recommend trying again.</p>
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={navigateHome}>
              Return Home
            </Button>
            <Button variant="primary" onClick={controller.start}>
              Try Again
            </Button>
          </>
        }
      />
    );
  }

  if (controller.isSuccess) {
    return (
      <MessageState
        kaomoji={kaomojis.proud}
        title="Tracks Removed!"
        tone="positive"
        subtitle={
          <>
            <p>
              You just cleaned out <span className="text-primary">{dislikePercentage}%</span> of
              your playlist.
            </p>
            <p className="text-sm text-muted">(now you get to skip less)</p>
          </>
        }
        actions={
          <>
            {backupPlaylist && (
              <Button
                variant="secondary"
                onClick={() => openExternalUrl(backupPlaylist.external_urls.spotify)}
              >
                Open Backup Playlist
              </Button>
            )}
            <Button variant="primary" onClick={navigateHome}>
              Return Home
            </Button>
          </>
        }
      />
    );
  }

  return (
    <MessageState
      kaomoji={kaomojis.working}
      title="Submitting to Spotify"
      tone="positive"
      subtitle={
        <div className="flex justify-center items-center gap-2 mt-2">
          <Spinner size="sm" />
          <p className="text-muted">
            {controller.phase ? SWIPE_PHASE_DESCRIPTIONS[controller.phase] : "Starting up..."}
          </p>
        </div>
      }
    />
  );
};

export default SwipeSubmitPage;
