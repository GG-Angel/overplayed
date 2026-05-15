import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const TextArea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea
    className={cn(
      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
      "placeholder:text-muted-foreground resize-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);

export default TextArea;
