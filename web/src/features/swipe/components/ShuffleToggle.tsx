import { cn } from "@/lib/utils";
import { Shuffle } from "lucide-react";

type ShuffleToggleProps = {
  enabled: boolean;
  onToggle: () => void;
};

const ShuffleToggle = ({ enabled, onToggle }: ShuffleToggleProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={cn(
        "inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors",
        enabled
          ? "border-primary text-primary"
          : "border-faded text-muted hover:text-foreground hover:border-muted"
      )}
    >
      <Shuffle className="size-3.5 shrink-0" />
      Shuffle
    </button>
  );
};

export default ShuffleToggle;
