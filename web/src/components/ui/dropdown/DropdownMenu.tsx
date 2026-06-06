import type { ReactNode } from "react";
import Card from "../Card";

type DropdownMenuProps = {
  children: ReactNode;
};

// TODO: add radius sm and padding xs

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  return <Card className="flex-col gap-1">{children}</Card>;
};

export default DropdownMenu;
