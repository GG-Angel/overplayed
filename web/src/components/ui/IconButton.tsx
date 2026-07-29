import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border-2 cursor-pointer active:opacity-75 disabled:opacity-25 disabled:pointer-events-none transition-all",
  {
    variants: {
      size: { xs: "p-2.5", sm: "p-4", md: "p-4.5" },
      variant: {
        neutral: "text-muted border-faded hover:text-foreground hover:border-muted hover:bg-muted/10",
        green: "text-primary border-primary/50 hover:border-primary hover:bg-primary/15",
        red: "text-destructive border-destructive/50 hover:border-destructive hover:bg-destructive/15",
        yellow: "text-amber-400 border-amber-400/50 hover:border-amber-400 hover:bg-amber-400/15",
        blue: "text-sky-400 border-sky-400/50 hover:border-sky-400 hover:bg-sky-400/15",
      },
    },
    defaultVariants: { size: "md", variant: "neutral" },
  }
);

const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      xs: "size-4",
      sm: "size-5",
      md: "size-7",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type IconButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    icon: LucideIcon;
    filled?: boolean;
  };

const IconButton = ({
  icon: Icon,
  size,
  variant,
  filled = false,
  className,
  ...props
}: IconButtonProps) => {
  return (
    <button type="button" className={cn(buttonVariants({ size, variant }), className)} {...props}>
      <Icon className={iconVariants({ size })} fill={filled ? "currentColor" : "none"} />
    </button>
  );
};

export default IconButton;
