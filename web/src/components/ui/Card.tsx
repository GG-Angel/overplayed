import { cn } from "@/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const cardVariants = cva("flex bg-sp-gray border-2 border-sp-gray-light", {
  variants: {
    size: {
      default: "px-4 py-3 rounded-xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

const Card = ({ className, size, children, ...props }: CardProps) => {
  return (
    <div className={cn(cardVariants({ size, className }))} {...props}>
      {children}
    </div>
  );
};

export default Card;
