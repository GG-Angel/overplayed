import Button from "@/components/ui/Button";
import useConfetti from "@/hooks/useConfetti";
import type { Playlist } from "@/lib/types";
import { openExternalUrl } from "@/lib/utils";

type SuccessViewProps = {
  newPlaylist: Playlist | null;
  dislikes: number;
  total: number;
  onHome: () => void;
};

const SuccessView = ({ newPlaylist, dislikes, total, onHome }: SuccessViewProps) => {
  const ratio = total > 0 ? Math.round((dislikes / total) * 100) : 0;
  useConfetti();

  return (
    <div className="flex flex-col h-full justify-center gap-6">
      <div className="text-center">
        <p className="text-4xl mb-2 text-primary">{"ദ്ദി(｡•̀ ,<)~✩‧₊"}</p>
        <p className="text-xl font-medium">Tracks Removed!</p>
        <p>
          You just cleaned out <span className="text-primary">{ratio}%</span> of your playlist.
        </p>
        <p className="text-sm text-muted-foreground">(now you get to skip less)</p>
      </div>
      <div className="flex justify-center gap-2">
        {newPlaylist && (
          <Button
            variant="secondary"
            onClick={() => openExternalUrl(newPlaylist.external_urls.spotify)}
          >
            View Backup Playlist
          </Button>
        )}
        <Button variant="primary" onClick={onHome}>
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default SuccessView;
