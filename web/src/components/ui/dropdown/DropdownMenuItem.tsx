import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type DropdownMenuItemProps = ComponentProps<"div">;

const DropdownMenuItem = ({ className, children, ...props }: DropdownMenuItemProps) => {
  return (
    <div
      className={cn(
        "flex items-center py-1.5 px-3 gap-2 text-card-foreground rounded-sm overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default DropdownMenuItem;
