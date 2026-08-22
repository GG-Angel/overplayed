import { cn } from "@/lib/utils";
import type { IconComponent } from "@/types/icon";
import type { ComponentProps } from "react";

export type CardHeadingProps = ComponentProps<"h2"> & {
  icon: IconComponent;
};

const CardHeading = ({ icon: Icon, className, children, ...props }: CardHeadingProps) => (
  <h2 className={cn("flex items-center gap-2", className)} {...props}>
    <Icon className="shrink-0" />
    {children}
  </h2>
);

export default CardHeading;
