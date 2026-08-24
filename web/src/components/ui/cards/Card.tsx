import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ElementType } from "react";

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
      lg: "px-8 py-6",
      xl: "p-8",
    },
  },
  defaultVariants: {
    tone: "default",
    radius: "md",
    padding: "md",
  },
});

type CardVariants = VariantProps<typeof cardVariants>;

export type CardDivProps = CardVariants & {
  as?: "div";
  type?: never;
  disabled?: never;
} & ComponentProps<"div">;
export type CardButtonProps = CardVariants & { as: "button" } & ComponentProps<"button">;
export type CardProps = CardDivProps | CardButtonProps;

const Card = ({ as = "div", className, tone, radius, padding, children, ...props }: CardProps) => {
  const Component = as as ElementType;

  return (
    <Component className={cn(cardVariants({ tone, radius, padding }), className)} {...props}>
      {children}
    </Component>
  );
};

export default Card;
