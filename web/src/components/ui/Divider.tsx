import { cn } from "../../utils";

type DividerProps = {
  className?: string;
};

const Divider = ({ className, ...props }: DividerProps) => {
  return <hr className={cn("h-px w-full border-0 bg-border", className)} {...props} />;
};

export default Divider;
