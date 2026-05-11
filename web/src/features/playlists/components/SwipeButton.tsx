import { cn } from "@/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

const buttonVariants = cva(
  "flex items-center justify-center rounded-full border-2 active:opacity-75 disabled:opacity-25 disabled:pointer-events-none transition-opacity",
  {
    variants: {
      size: { sm: "p-4", md: "p-4.5" },
      intent: {
        like: "text-emerald-400 border-emerald-400/50",
        dislike: "text-rose-400 border-rose-400/50",
        undo: "text-amber-400 border-amber-400/50",
        finish: "text-sky-400 border-sky-400/50",
      },
    },
    defaultVariants: { size: "md", intent: "like" },
  }
);

const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "size-5",
      md: "size-7",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type SwipeButtonProps = VariantProps<typeof buttonVariants> & {
  icon: LucideIcon;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

const SwipeButton = ({
  icon: Icon,
  size,
  intent,
  className,
  onClick,
  disabled,
}: SwipeButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ size, intent }), className)}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className={iconVariants({ size })} />
    </button>
  );
};

export default SwipeButton;
