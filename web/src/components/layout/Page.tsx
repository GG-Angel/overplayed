import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const pageVariants = cva("flex flex-col w-full self-center", {
  variants: {
    width: {
      full: "",
      xl: "max-w-xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
    },
    gap: {
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
    },
  },
  defaultVariants: {
    width: "full",
    gap: "md",
  },
});

export type PageProps = ComponentProps<"main"> & VariantProps<typeof pageVariants>;

const Page = ({ className, width, gap, children, ...props }: PageProps) => (
  <main className={cn(pageVariants({ width, gap }), className)} {...props}>
    {children}
  </main>
);

export default Page;
