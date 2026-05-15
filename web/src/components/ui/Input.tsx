import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <input
    className={cn(
      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);

export default Input;
