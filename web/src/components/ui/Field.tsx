import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: (id: string) => ReactNode;
};

const Field = ({ label, required, error, className, children }: FieldProps) => {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children(id)}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default Field;
