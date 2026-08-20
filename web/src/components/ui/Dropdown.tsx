import { useState, type ComponentProps, type ReactNode } from "react";
import { useClickOutside } from "../../hooks";
import { cn } from "../../utils";
import Card from "./Card";
import Divider from "./Divider";

type DropdownProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
};

const Dropdown = ({ trigger, children, className, align = "left" }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div className="absolute top-[calc(100%+8px)] z-50" style={{ [align]: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownMenu = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <Card radius="sm" padding="xs" className={cn("flex-col gap-1", className)}>
    {children}
  </Card>
);

export type DropdownMenuItemProps = ComponentProps<"div">;

export const DropdownMenuItem = ({
  className,
  children,
  ...props
}: DropdownMenuItemProps) => (
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

export const DropdownMenuButton = ({
  className,
  children,
  onClick,
  ...props
}: DropdownMenuItemProps & { onClick: () => void }) => (
  <DropdownMenuItem
    className={cn("cursor-pointer hover:bg-card-border", className)}
    onClick={onClick}
    {...props}
  >
    {children}
  </DropdownMenuItem>
);

export const DropdownMenuDivider = () => <Divider className="my-1" />;

export const DropdownMenuSection = ({ label }: { label: string }) => (
  <p className="mx-3 my-1.5 text-xs font-semibold text-muted">{label}</p>
);

export default Dropdown;
