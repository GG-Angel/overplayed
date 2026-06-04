import Button from "@/components/ui/Button";
import useConfetti from "@/hooks/useConfetti";
import type { PlaylistMetadata } from "@/lib/types";
import { openExternalUrl } from "@/lib/utils";
import { useSwipeContext } from "../context/SwipeContext";
import MessageState from "../../../components/states/MessageState";

type SuccessViewProps = {
  newPlaylist: PlaylistMetadata | null;
};

const SuccessView = ({ newPlaylist }: SuccessViewProps) => {
  const { total, dislikes, goHome } = useSwipeContext();
  const ratio = total && total > 0 ? Math.round((dislikes.length / total) * 100) : 0;
  useConfetti();

  return (
    <MessageState
      kaomoji="ദ്ദി(｡•̀ ,<)~✩‧₊"
      title="Tracks Removed!"
      subtitle={
        <>
          <p>
            You just cleaned out <span className="text-primary">{ratio}%</span> of your playlist.
          </p>
          <p className="text-sm text-muted-foreground">(now you get to skip less)</p>
        </>
      }
      actions={
        <>
          {newPlaylist && (
            <Button
              variant="secondary"
              onClick={() => openExternalUrl(newPlaylist.external_urls.spotify)}
            >
              View Backup Playlist
            </Button>
          )}
          <Button variant="primary" onClick={goHome}>
            Return Home
          </Button>
        </>
      }
    />
  );
};

export default SuccessView;
