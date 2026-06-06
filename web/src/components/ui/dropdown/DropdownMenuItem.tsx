import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type DropdownMenuItem = ComponentProps<"button">;

const DropdownMenuItem = ({ className, children, ...props }: DropdownMenuItem) => {
  return (
    <button
      className={cn(
        "flex justify-between items-center cursor-pointer py-2 px-3 text-card-foreground hover:bg-card-border rounded-xs",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default DropdownMenuItem;
