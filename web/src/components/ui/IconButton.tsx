import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border-2 hover:cursor-pointer active:opacity-75 disabled:opacity-25 disabled:pointer-events-none transition-opacity",
  {
    variants: {
      size: { xs: "p-2.5", sm: "p-4", md: "p-4.5" },
      variant: {
        neutral: "text-muted-foreground border-muted",
        green: "text-primary border-primary/50",
        red: "text-destructive border-destructive/50",
        yellow: "text-amber-400 border-amber-400/50",
        blue: "text-sky-400 border-sky-400/50",
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
    <button className={cn(buttonVariants({ size, variant }), className)} {...props}>
      <Icon className={iconVariants({ size })} fill={filled ? "currentColor" : "none"} />
    </button>
  );
};

export default IconButton;
