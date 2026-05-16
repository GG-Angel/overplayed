import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const cardVariants = cva("flex bg-card text-card-foreground border-2 border-card-border", {
  variants: {
    size: {
      sm: "rounded-lg",
      md: "rounded-xl",
    },
    padding: {
      wide: "",
      square: "",
    },
  },
  compoundVariants: [
    { size: "sm", padding: "wide", class: "px-3 py-2" },
    { size: "sm", padding: "square", class: "p-3" },
    { size: "md", padding: "wide", class: "px-4 py-3" },
    { size: "md", padding: "square", class: "p-4" },
  ],
  defaultVariants: {
    size: "md",
    padding: "wide",
  },
});

export type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

const Card = ({ className, size, padding, children, ...props }: CardProps) => {
  return (
    <div className={cn(cardVariants({ size, padding }), className)} {...props}>
      {children}
    </div>
  );
};

export default Card;
