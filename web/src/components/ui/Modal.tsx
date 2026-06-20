import type { ReactNode } from "react";
import Card from "./Card";
import IconButton from "./IconButton";
import { X } from "lucide-react";
import Divider from "./Divider";
import useClickOutside from "@/hooks/useClickOutside";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const Modal = ({ title, onClose, children }: ModalProps) => {
  const ref = useClickOutside<HTMLDivElement>(onClose);
  return (
    <div className="flex items-center justify-center fixed top-0 left-0 size-full z-1000 backdrop-blur-md bg-background/75">
      <Card ref={ref} className="flex flex-col gap-2 w-5/6 max-w-3xl py-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className="tracking-tight text-2xl font-bold">{title}</h3>
          <IconButton icon={X} onClick={onClose} size="xs" />
        </div>
        {children && (
          <>
            <Divider />
            {children}
          </>
        )}
      </Card>
    </div>
  );
};

export default Modal;
