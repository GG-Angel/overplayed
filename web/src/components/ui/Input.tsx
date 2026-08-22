import { cn } from "@/lib/utils";
import { useRef, type ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import Card from "./cards/Card";

export type InputProps = ComponentProps<"input"> & {
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
};

const Input = ({ label, hint, error, disabled, icon: Icon, className, ...props }: InputProps) => {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label className="font-medium text-sm">{label}</label>}
      <Card
        onClick={() => searchRef.current?.focus()}
        radius="xs"
        padding="none"
        className={cn(
          "flex items-center gap-2 py-2 px-3 cursor-text focus-within:border-muted transition-opacity",
          disabled && "opacity-50"
        )}
      >
        {Icon && <Icon className="text-muted shrink-0" />}
        <input ref={searchRef} className="w-full outline-none" disabled={disabled} {...props} />
      </Card>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default Input;
