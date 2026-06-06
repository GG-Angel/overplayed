import { cn } from "@/lib/utils";
import { useRef, useState, type ReactNode } from "react";

type DropdownProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
};

const Dropdown = ({ trigger, children, className, align = "left" }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <div className="absolute top-[calc(100%+4px)]" style={{ [align]: 0 }}>
        {children}
      </div>
    </div>
  );
};

export default Dropdown;
