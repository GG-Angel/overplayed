import { Shuffle } from "lucide-react";

type ShuffleButtonProps = {
  onShuffle: () => void;
  disabled?: boolean;
};

const ShuffleButton = ({ onShuffle, disabled = false }: ShuffleButtonProps) => {
  return (
    <button
      type="button"
      onClick={onShuffle}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-faded px-2.5 py-1 text-xs font-medium text-muted cursor-pointer transition-colors hover:text-foreground hover:border-muted disabled:opacity-25 disabled:pointer-events-none"
    >
      <Shuffle className="size-3.5 shrink-0" />
      Shuffle
    </button>
  );
};

export default ShuffleButton;
