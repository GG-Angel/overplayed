import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { motion, type MotionValue } from "framer-motion";

type SwipeCardDecisionOverlayProps = {
  icon: LucideIcon;
  opacity?: number | MotionValue<number>;
  className?: string;
};

const SwipeCardDecisionOverlay = ({
  icon: Icon,
  className,
  opacity = 1,
}: SwipeCardDecisionOverlayProps) => (
  <motion.div
    style={{ opacity }}
    className={cn(
      "absolute inset-0 flex justify-center items-center bg-linear-to-t rounded-xl",
      className
    )}
  >
    <Icon
      fill="currentColor"
      fillOpacity={0.6}
      className="drop-shadow-black drop-shadow-lg size-1/3"
    />
  </motion.div>
);

export default SwipeCardDecisionOverlay;
