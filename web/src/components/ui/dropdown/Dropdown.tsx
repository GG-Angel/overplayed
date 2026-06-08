import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

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
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className="absolute top-[calc(100%+4px)] z-50" style={{ [align]: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
