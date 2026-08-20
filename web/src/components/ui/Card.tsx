import { cn } from "../../utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const cardVariants = cva("flex overflow-hidden border-2 text-card-foreground shadow-md", {
  variants: {
    tone: {
      default: "bg-card border-card-border",
      muted: "bg-card/40 border-card-border/40",
      negative: "text-destructive bg-destructive/5 border-destructive/10",
      positive: "text-primary bg-primary/5 border-primary/10",
    },
    radius: {
      xs: "rounded-md",
      sm: "rounded-lg",
      md: "rounded-xl",
      lg: "rounded-2xl",
    },
    padding: {
      none: "p-0",
      xs: "p-1.5",
      sm: "p-3",
      md: "p-4",
      lg: "p-8",
    },
  },
  defaultVariants: {
    tone: "default",
    radius: "md",
    padding: "md",
  },
});

export type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

const Card = ({ className, tone, radius, padding, children, ...props }: CardProps) => {
  return (
    <div className={cn(cardVariants({ tone, radius, padding }), className)} {...props}>
      {children}
    </div>
  );
};

export default Card;
