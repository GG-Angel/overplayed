import { cn } from "@/lib/utils";
import { useRef, type ComponentProps } from "react";
import Card from "./Card";
import type { LucideIcon } from "lucide-react";

type InputProps = ComponentProps<"input"> & {
  className?: string;
  icon?: LucideIcon;
};

const Input = ({ icon: Icon, className, ...props }: InputProps) => {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <Card
      onClick={() => searchRef.current?.focus()}
      radius="xs"
      padding="none"
      className={cn(
        "flex items-center gap-2 py-2 px-3 cursor-text focus-within:border-muted-foreground",
        className
      )}
    >
      {Icon && <Icon className="text-muted-foreground" />}
      <input ref={searchRef} className={cn("w-full outline-none", className)} {...props} />
    </Card>
  );
};

export default Input;
