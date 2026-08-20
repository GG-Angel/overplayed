import { Check, Heart, Undo, X } from "lucide-react";
import { IconButton } from "../../components/ui/Button";

const SwipeButtons = ({
  onUndo = () => {},
  onDislike = () => {},
  onLike = () => {},
  onFinish = () => {},
  canSwipe = true,
  canUndo = true,
  canFinish = true,
}: {
  onUndo?: () => void;
  onDislike?: () => void;
  onLike?: () => void;
  onFinish?: () => void;
  canSwipe?: boolean;
  canUndo?: boolean;
  canFinish?: boolean;
}) => (
  <div className="flex items-end gap-2">
    <IconButton
      aria-label="Undo"
      icon={Undo}
      size="sm"
      variant="yellow"
      onClick={onUndo}
      disabled={!canUndo}
    />
    <IconButton
      aria-label="Dislike"
      icon={X}
      variant="red"
      onClick={onDislike}
      disabled={!canSwipe}
    />
    <IconButton
      aria-label="Like"
      icon={Heart}
      variant="green"
      onClick={onLike}
      disabled={!canSwipe}
    />
    <IconButton
      aria-label="Finish"
      icon={Check}
      size="sm"
      variant="blue"
      onClick={onFinish}
      disabled={!canFinish}
    />
  </div>
);

export default SwipeButtons;
