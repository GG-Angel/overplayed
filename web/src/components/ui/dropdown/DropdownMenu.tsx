import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Card from "../cards/Card";

type DropdownMenuProps = {
  children: ReactNode;
  className?: string;
};

const DropdownMenu = ({ children, className }: DropdownMenuProps) => {
  return (
    <Card radius="sm" padding="xs" className={cn("flex-col gap-1", className)}>
      {children}
    </Card>
  );
};

export default DropdownMenu;
