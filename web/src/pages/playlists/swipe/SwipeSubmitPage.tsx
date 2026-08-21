import MessageState from "@/components/states/MessageState";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { KAOMOJIS } from "@/lib/constants";
import useSubmitSwipes from "@/features/swipe/hooks/useSubmitSwipes";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import useConfetti from "@/hooks/useConfetti";
import { formatPercentage, openExternalUrl } from "@/lib/utils";
import { ExternalLink, Home, Play, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SwipeSubmitPage = () => {
  const navigate = useNavigate();
  const { playlist, session } = useSwipeContext();
  const controller = useSubmitSwipes();

  // show confetti on success
  useConfetti({ enabled: controller.isSuccess });

  const navigateHome = () => navigate("/", { replace: true });
  const navigateToSwipePage = () => navigate("..");

  if (controller.isSuccess) {
    const backupPlaylist = controller.data?.backup_playlist;
    const dislikePercentage =
      playlist.tracks.total > 0 ? session.dislikes.length / playlist.tracks.total : 0;

    return (
      <MessageState
        kaomoji={KAOMOJIS.proud}
        title="Tracks Removed!"
        tone="positive"
        subtitle={
          <>
            <p>
              You just cleaned out{" "}
              <span className="text-primary">{formatPercentage(dislikePercentage)}</span> of your
              playlist.
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

  if (controller.isError) {
    return (
      <MessageState
        kaomoji={KAOMOJIS.stressed}
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
              onClick={controller.retry}
            >
              Try Again
            </Button>
          </>
        }
      />
    );
  }

  if (!controller.hasDislikes) {
    return (
      <MessageState
        kaomoji={KAOMOJIS.uncertain}
        title="Invalid Submission"
        tone="neutral"
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

  return (
    <MessageState
      kaomoji={KAOMOJIS.working}
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
