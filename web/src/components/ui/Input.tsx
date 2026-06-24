import { cn } from "@/lib/utils";
import { useRef, type ComponentProps } from "react";
import Card from "./Card";
import type { LucideIcon } from "lucide-react";

export type InputProps = ComponentProps<"input"> & {
  label?: string;
  icon?: LucideIcon;
  className?: string;
};

const Input = ({ label, icon: Icon, className, ...props }: InputProps) => {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2">
      {label && <label>{label}</label>}
      <Card
        onClick={() => searchRef.current?.focus()}
        radius="xs"
        padding="none"
        className={cn(
          "flex items-center gap-2 py-2 px-3 cursor-text focus-within:border-muted",
          className
        )}
      >
        {Icon && <Icon className="text-muted" />}
        <input ref={searchRef} className={cn("w-full outline-none", className)} {...props} />
      </Card>
    </div>
  );
};

export default Input;
