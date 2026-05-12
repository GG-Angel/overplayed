import { type ComponentProps, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        filled: "bg-accent text-background shadow hover:bg-accent/90",
        outline: "bg-accent/15 text-accent shadow-sm hover:bg-accent/20",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-9 px-4 py-2",
        lg: "h-10 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    icon?: ReactNode;
  };

const Button = ({ className, variant, size, icon, children, ...props }: ButtonProps) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
    {icon}
    <span>{children}</span>
  </button>
);

export default Button;
