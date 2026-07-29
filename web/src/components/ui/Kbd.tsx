import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type KbdProps = ComponentProps<"kbd">;

const Kbd = ({ className, children, ...props }: KbdProps) => {
  return (
    <kbd
      className={cn(
        "inline-flex min-w-6 items-center justify-center rounded-md border-2 border-faded bg-faded/30 px-1.5 py-0.5 font-sans text-xs font-medium text-card-foreground",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
};

export default Kbd;
