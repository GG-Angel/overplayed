import MessageState from "@/components/states/MessageState";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import useSubmitSwipes from "@/features/swipe/hooks/useSubmitSwipes";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import useConfetti from "@/hooks/useConfetti";
import { removeFromStorage, storageKeys } from "@/lib/storage";
import { kaomojis } from "@/lib/kaomoji";
import { openExternalUrl } from "@/lib/utils";
import { ExternalLink, Home, Play, RotateCcw } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const SwipeSubmitPage = () => {
  const navigate = useNavigate();
  const { playlist, session, setHasSubmitted } = useSwipeContext();
  const controller = useSubmitSwipes();
  const [dislikePercentage] = useState(() =>
    playlist.metadata.tracks.total > 0
      ? Math.round((session.dislikes.length / playlist.metadata.tracks.total) * 100)
      : 0
  );

  // submit on page load
  const initialSubmit = useEffectEvent(() => {
    controller.start();
  });
  useEffect(() => {
    initialSubmit();
  }, []);

  // show confetti on success
  useConfetti({ enabled: controller.mutation.isSuccess });

  // prevent leave modal on successful completion
  useEffect(() => {
    if (controller.mutation.isSuccess) {
      removeFromStorage(
        sessionStorage,
        storageKeys.swipes(playlist.metadata.id, playlist.metadata.snapshot_id)
      );
      setHasSubmitted(true);
    }
  });

  const navigateHome = () => navigate("/", { replace: true });
  const navigateToSwipePage = () => navigate("..");

  if (!controller.hasDislikes) {
    return (
      <MessageState
        kaomoji={kaomojis.uncertain}
        title="Invalid Submission"
        tone="negative"
        subtitle={<p>You haven't disliked any tracks...</p>}
        actions={
          <>
            <Button icon={<Home className="size-4" />} variant="secondary" onClick={navigateHome}>
              Return Home
            </Button>
            <Button
              icon={<Play className="size-4" />}
              variant="primary"
              onClick={navigateToSwipePage}
            >
              Swipe Tracks
            </Button>
          </>
        }
      />
    );
  }

  if (controller.mutation.isError) {
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
            <Button icon={<Home className="size-4" />} variant="secondary" onClick={navigateHome}>
              Return Home
            </Button>
            <Button
              icon={<RotateCcw className="size-4" />}
              variant="primary"
              onClick={controller.start}
            >
              Try Again
            </Button>
          </>
        }
      />
    );
  }

  if (controller.mutation.isSuccess) {
    const backupPlaylist = controller.mutation.data.backup_playlist;
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
                icon={<ExternalLink className="size-4" />}
                variant="secondary"
                onClick={() => openExternalUrl(backupPlaylist.external_urls.spotify)}
              >
                Open Backup Playlist
              </Button>
            )}
            <Button icon={<Home className="size-4" />} variant="primary" onClick={navigateHome}>
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
          <p className="text-muted">Processing changes...</p>
        </div>
      }
    />
  );
};

export default SwipeSubmitPage;
