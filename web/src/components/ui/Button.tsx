import { type ComponentProps, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-primary/15 text-primary hover:bg-primary/20",
        tertiary: "bg-faded text-card-foreground hover:bg-faded/75",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs shadow-2xs",
        md: "h-9 px-4 py-2 shadow-xs",
        lg: "h-10 rounded-md px-8 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
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
