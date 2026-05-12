import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle, type LucideProps } from "lucide-react";

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

export type SpinnerProps = LucideProps & VariantProps<typeof spinnerVariants>;

export const Spinner = ({ size, className }: SpinnerProps) => (
  <LoaderCircle className={cn(spinnerVariants({ size }), className)} />
);
