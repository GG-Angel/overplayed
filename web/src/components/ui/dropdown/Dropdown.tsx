import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import { type Dispatch, type ReactNode, type SetStateAction } from "react";

type DropdownProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
};

const Dropdown = ({
  open,
  setOpen,
  trigger,
  children,
  className,
  align = "left",
}: DropdownProps) => {
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      {trigger}
      {open && (
        <div className="absolute top-[calc(100%+8px)] z-50" style={{ [align]: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
