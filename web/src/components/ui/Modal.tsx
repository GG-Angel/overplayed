import type { ReactNode } from "react";
import Card from "./Card";
import useClickOutside from "@/hooks/useClickOutside";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import { MODAL_SHORTCUTS } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

export type ModalProps = {
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

const Modal = ({ onClose, children, className }: ModalProps) => {
  const ref = useClickOutside<HTMLDivElement>(onClose);
  useKeyboardShortcuts(MODAL_SHORTCUTS, { close: onClose });

  return (
    <div className="flex items-center justify-center fixed top-0 left-0 size-full z-1000 backdrop-blur-sm bg-background/75">
      <Card ref={ref} className={cn("w-3/4 max-w-3xl relative", className)} padding="xl">
        {children}
      </Card>
    </div>
  );
};

export default Modal;
