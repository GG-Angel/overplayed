import { cn } from "@/utils/cn";
import { LoaderCircle } from "lucide-react";

const sizes = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

export type SpinnerProps = {
  size?: keyof typeof sizes;
  className?: string;
};

export const Spinner = ({ size = "md", className = "" }: SpinnerProps) => {
  return (
    <>
      <LoaderCircle className={cn("animate-spin", sizes[size], className)} />
      <span className="sr-only">Loading...</span>
    </>
  );
};
