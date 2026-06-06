import type { ReactNode } from "react";
import Card from "../Card";
import { cn } from "@/lib/utils";

type DropdownMenuProps = {
  children: ReactNode;
  className?: string;
};

// TODO: add radius sm and padding xs

const DropdownMenu = ({ children, className }: DropdownMenuProps) => {
  return <Card className={cn("flex-col gap-1", className)}>{children}</Card>;
};

export default DropdownMenu;
