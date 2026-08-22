import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type ExternalLinkProps = ComponentProps<"a"> & { href: string };

const ExternalLink = ({ className, ...props }: ExternalLinkProps) => (
  <a
    target="_blank"
    rel="noopener noreferrer"
    className={cn("hover:underline", className)}
    {...props}
  />
);

export default ExternalLink;
