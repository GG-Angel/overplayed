import IconButton from "@/components/ui/IconButton";
import { Check, Heart, Undo, X } from "lucide-react";

type SwipeButtonsProps = {
  onUndo?: () => void;
  onDislike?: () => void;
  onLike?: () => void;
  onFinish?: () => void;
  canSwipe?: boolean;
  canUndo?: boolean;
  canFinish?: boolean;
};

const SwipeButtons = ({
  onUndo = () => {},
  onDislike = () => {},
  onLike = () => {},
  onFinish = () => {},
  canSwipe = true,
  canUndo = true,
  canFinish = true,
}: SwipeButtonsProps) => {
  return (
    <div className="flex items-end gap-2">
      <IconButton icon={Undo} size="sm" variant="yellow" onClick={onUndo} disabled={!canUndo} />
      <IconButton icon={X} variant="red" onClick={onDislike} disabled={!canSwipe} />
      <IconButton icon={Heart} variant="green" onClick={onLike} disabled={!canSwipe} />
      <IconButton icon={Check} size="sm" variant="blue" onClick={onFinish} disabled={!canFinish} />
    </div>
  );
};

export default SwipeButtons;
