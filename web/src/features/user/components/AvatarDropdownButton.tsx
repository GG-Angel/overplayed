import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type AvatarDropdownButtonProps = ComponentProps<"button"> & {
  icon: ReactNode;
};

const AvatarDropdownButton = ({
  icon,
  children,
  className,
  ...props
}: AvatarDropdownButtonProps) => (
  <button
    role="menuitem"
    className={cn(
      "flex gap-1.5 items-center py-2 px-4 text-left cursor-pointer hover:bg-card-border/50",
      className
    )}
    {...props}
  >
    {icon}
    {children}
  </button>
);

export default AvatarDropdownButton;
