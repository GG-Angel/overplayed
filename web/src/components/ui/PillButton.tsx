import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { type ComponentProps, type ReactNode } from "react";

type PillButtonProps = {
  icon: LucideIcon;
  children: ReactNode;
  shortcut?: {
    key: string;
    triggers: number;
  };
} & ComponentProps<"button">;

const PillButton = ({ icon: Icon, children, shortcut, className, ...props }: PillButtonProps) => {
  return (
    <button
      key={shortcut && `${shortcut.key}-${shortcut.triggers}`}
      className={cn(
        "inline-flex gap-1.5 items-center shrink-0 rounded-full border border-faded px-2.5 py-1 text-xs font-medium text-muted cursor-pointer transition-colors hover:text-foreground hover:border-muted disabled:opacity-25 disabled:pointer-events-none",
        (shortcut?.triggers ?? 0) > 0 && "animate-flash",
        className
      )}
      {...props}
    >
      <Icon className="size-3.5 shrink-0" />
      {children}
    </button>
  );
};

export default PillButton;
