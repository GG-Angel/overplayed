import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/utils/cn";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-16 w-16",
      xl: "h-24 w-24",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type SpinnerProps = VariantProps<typeof spinnerVariants> & {
  className?: string;
};

export const Spinner = ({ size, className }: SpinnerProps) => {
  return (
    <>
      <LoaderCircle className={cn(spinnerVariants({ size }), className)} />
      <span className="sr-only">Loading...</span>
    </>
  );
};
