import { cn } from "../../utils";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle, type LucideProps } from "lucide-react";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      xs: "size-3.5",
      sm: "size-4",
      md: "size-8",
      lg: "size-12",
      xl: "size-16",
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
