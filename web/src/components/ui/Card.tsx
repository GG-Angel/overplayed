import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const cardVariants = cva(
  "flex bg-card text-card-foreground border-2 border-card-border overflow-hidden",
  {
    variants: {
      tone: {
        default: "",
        muted: "bg-card/40 border-card-border/40",
      },
      size: {
        xs: "rounded-md",
        sm: "rounded-lg",
        md: "rounded-xl",
        lg: "rounded-2xl",
      },
      padding: {
        wide: "",
        square: "",
        tall: "",
      },
    },
    compoundVariants: [
      { size: "xs", padding: "wide", class: "px-1.5 py-1" },
      { size: "xs", padding: "square", class: "p-1.5" },
      { size: "xs", padding: "tall", class: "px-1 py-1.5" },
      { size: "sm", padding: "wide", class: "px-3 py-2" },
      { size: "sm", padding: "square", class: "p-3" },
      { size: "sm", padding: "tall", class: "px-2 py-3" },
      { size: "md", padding: "wide", class: "px-4 py-3" },
      { size: "md", padding: "square", class: "p-4" },
      { size: "md", padding: "tall", class: "px-3 py-4" },
      { size: "lg", padding: "wide", class: "px-8 py-6" },
      { size: "lg", padding: "square", class: "p-8" },
      { size: "lg", padding: "tall", class: "px-6 py-8" },
    ],
    defaultVariants: {
      tone: "default",
      size: "md",
      padding: "wide",
    },
  }
);

export type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

const Card = ({ className, tone, size, padding, children, ...props }: CardProps) => {
  return (
    <div className={cn(cardVariants({ tone, size, padding }), className)} {...props}>
      {children}
    </div>
  );
};

export default Card;
