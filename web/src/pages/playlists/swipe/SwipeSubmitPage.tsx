import MessageState from "@/components/states/MessageState";
import { Spinner } from "@/components/ui/Spinner";
import { KAOMOJIS } from "@/lib/constants";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import useConfetti from "@/hooks/useConfetti";
import { removeFromStorage, storageKeys } from "@/lib/storage";
import { formatPercentage, openExternalUrl } from "@/lib/utils";
import { ExternalLink, Home, Play, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubmitSwipes } from "@/api/mutations";
import { useEffect } from "react";

const SwipeSubmitPage = () => {
  const navigate = useNavigate();
  const { playlist, session, options, setHasSubmitted } = useSwipeContext();
  const { mutate, isSuccess, isError, data } = useSubmitSwipes(playlist.id, {
    options,
    uris: session.dislikes.map((t) => t.uri),
    tracks_swiped: session.swipes.length,
  });

  // submit swipes on page load
  useEffect(() => {
    mutate();
  }, []);

  useConfetti({ enabled: isSuccess });

  useEffect(() => {
    if (!isSuccess) return;
    setHasSubmitted(true);
    removeFromStorage(sessionStorage, storageKeys.swipes(playlist.id, playlist.snapshot_id));
  }, [isSuccess, playlist.id, playlist.snapshot_id, setHasSubmitted]);

  const navigateHome = () => navigate("/", { replace: true });
  const navigateToSwipePage = () => navigate("..");

  if (isSuccess) {
    const backupPlaylist = data.backup_playlist;
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
        actions={[
          backupPlaylist && {
            label: "Open Backup Playlist",
            icon: ExternalLink,
            variant: "secondary",
            onClick: () => openExternalUrl(backupPlaylist.external_urls.spotify),
          },
          { label: "Return Home", icon: Home, variant: "primary", onClick: navigateHome },
        ]}
      />
    );
  }

  if (isError) {
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
        actions={[
          { label: "Return Home", icon: Home, variant: "secondary", onClick: navigateHome },
          { label: "Try Again", icon: RotateCcw, variant: "primary", onClick: mutate },
        ]}
      />
    );
  }

  if (session.dislikes.length === 0) {
    return (
      <MessageState
        kaomoji={KAOMOJIS.uncertain}
        title="Invalid Submission"
        tone="neutral"
        subtitle={<p>You haven't disliked any tracks...</p>}
        actions={[
          { label: "Return Home", icon: Home, variant: "secondary", onClick: navigateHome },
          { label: "Swipe Tracks", icon: Play, variant: "primary", onClick: navigateToSwipePage },
        ]}
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
