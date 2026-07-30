import { cn } from "@/lib/utils";
import { Shuffle } from "lucide-react";

type ShuffleButtonProps = {
  onShuffle: () => void;
  shuffleCount: number;
  disabled?: boolean;
};

const ShuffleButton = ({ onShuffle, shuffleCount, disabled = false }: ShuffleButtonProps) => {
  return (
    <button
      key={`shuffle-button-${shuffleCount}`}
      onClick={onShuffle}
      disabled={disabled}
      className={cn(
        "inline-flex gap-1.5 items-center shrink-0 rounded-full border border-faded px-2.5 py-1 text-xs font-medium text-muted cursor-pointer transition-colors hover:text-foreground hover:border-muted disabled:opacity-25 disabled:pointer-events-none",
        shuffleCount > 0 && "animate-flash"
      )}
    >
      <Shuffle className="size-3.5 shrink-0" />
      Shuffle
    </button>
  );
};

export default ShuffleButton;
