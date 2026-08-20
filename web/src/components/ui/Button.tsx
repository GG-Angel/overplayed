import { type ComponentProps, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils";

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

export type ButtonProps = ComponentProps<"button"> &
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

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full border-2 cursor-pointer active:opacity-75 disabled:opacity-25 disabled:pointer-events-none transition-[color,background-color,border-color,opacity]",
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
  variants: { size: { xs: "size-4", sm: "size-5", md: "size-7" } },
  defaultVariants: { size: "md" },
});

export type IconButtonProps = ComponentProps<"button"> &
  VariantProps<typeof iconButtonVariants> & {
    icon: LucideIcon;
    filled?: boolean;
  };

export const IconButton = ({
  icon: Icon,
  size,
  variant,
  filled = false,
  className,
  ...props
}: IconButtonProps) => (
  <button
    type="button"
    className={cn(iconButtonVariants({ size, variant }), className)}
    {...props}
  >
    <Icon className={iconVariants({ size })} fill={filled ? "currentColor" : "none"} />
  </button>
);

export type PillButtonProps = {
  icon: ReactNode;
  children: ReactNode;
  shortcut?: { key: string; triggers: number };
  shouldPulseWhenDisabled?: boolean;
} & ComponentProps<"button">;

export const PillButton = ({
  icon,
  children,
  shortcut,
  className,
  shouldPulseWhenDisabled = false,
  ...props
}: PillButtonProps) => (
  <button
    key={shortcut && `${shortcut.key}-${shortcut.triggers}`}
    className={cn(
      "inline-flex gap-1.5 items-center shrink-0 rounded-full border border-faded px-2.5 py-1 text-xs font-medium text-muted cursor-pointer transition-colors hover:text-foreground hover:border-muted disabled:opacity-25 disabled:pointer-events-none",
      shouldPulseWhenDisabled && "disabled:animate-pulse",
      (shortcut?.triggers ?? 0) > 0 && "animate-flash",
      className
    )}
    {...props}
  >
    {icon}
    {children}
  </button>
);
