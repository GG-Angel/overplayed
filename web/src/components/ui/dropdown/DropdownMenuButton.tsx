import { cn } from "@/lib/utils";
import DropdownMenuItem, { type DropdownMenuItemProps } from "./DropdownMenuItem";

type DropdownMenuButtonProps = DropdownMenuItemProps & {
  onClick: () => void;
};

const DropdownMenuButton = ({
  className,
  children,
  onClick,
  ...props
}: DropdownMenuButtonProps) => {
  return (
    <DropdownMenuItem
      className={cn("cursor-pointer hover:bg-card-border", className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </DropdownMenuItem>
  );
};

export default DropdownMenuButton;
