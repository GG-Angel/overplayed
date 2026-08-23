import { cn } from "@/lib/utils";
import { type ComponentProps, type ReactNode } from "react";

type PillButtonProps = {
  icon: ReactNode;
  children: ReactNode;
  shortcut?: {
    key: string;
    triggers: number;
  };
  shouldPulseWhenDisabled?: boolean;
} & ComponentProps<"button">;

const PillButton = ({
  icon: Icon,
  children,
  shortcut,
  className,
  shouldPulseWhenDisabled = false,
  ...props
}: PillButtonProps) => {
  return (
    <button
      type="button"
      key={shortcut && `${shortcut.key}-${shortcut.triggers}`}
      className={cn(
        "inline-flex gap-1.5 items-center shrink-0 rounded-full border border-faded px-2.5 py-1 text-xs font-medium text-muted cursor-pointer transition-all hover:text-foreground hover:border-muted disabled:opacity-25 disabled:pointer-events-none active:scale-[98%]",
        shouldPulseWhenDisabled && "disabled:animate-pulse",
        (shortcut?.triggers ?? 0) > 0 && "animate-flash",
        className
      )}
      {...props}
    >
      {Icon}
      {children}
    </button>
  );
};

export default PillButton;
