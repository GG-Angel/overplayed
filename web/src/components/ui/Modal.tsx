import type { ReactNode } from "react";
import Card from "./Card";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

type ModalProps = {
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

const Modal = ({ onClose, children, className }: ModalProps) => {
  const ref = useClickOutside<HTMLDivElement>(onClose);
  return (
    <div className="flex items-center justify-center fixed top-0 left-0 size-full z-1000 backdrop-blur-sm bg-background/75">
      <Card ref={ref} className={cn("w-3/4 max-w-3xl relative", className)} padding="lg">
        {children}
      </Card>
    </div>
  );
};

export default Modal;
