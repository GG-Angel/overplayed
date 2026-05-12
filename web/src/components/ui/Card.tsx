import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const cardVariants = cva("flex bg-sp-gray border-2 border-sp-gray-light", {
  variants: {
    size: {
      sm: "px-3 py-2 rounded-lg",
      md: "px-4 py-3 rounded-xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

const Card = ({ className, size, children, ...props }: CardProps) => {
  return (
    <div className={cn(cardVariants({ size }), className)} {...props}>
      {children}
    </div>
  );
};

export default Card;
