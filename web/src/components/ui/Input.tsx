import { cn } from "@/lib/utils";
import { useRef, type ComponentProps } from "react";
import Card from "./Card";
import type { LucideIcon } from "lucide-react";

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
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="font-medium text-sm">{label}</label>}
      <Card
        onClick={() => searchRef.current?.focus()}
        radius="xs"
        padding="none"
        className={cn(
          "flex items-center gap-2 py-2 px-3 cursor-text focus-within:border-muted transition-opacity",
          disabled && "opacity-50",
          className
        )}
      >
        {Icon && <Icon className="text-muted" />}
        <input
          ref={searchRef}
          className={cn("w-full outline-none", className)}
          disabled={disabled}
          {...props}
        />
      </Card>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default Input;
