import { cn } from "@/lib/utils";
import Card, { type CardDivProps } from "./Card";
import Checkbox from "./Checkbox";

export type ToggleCardProps = Omit<CardDivProps, "children"> & {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  whenEnabled: string;
  whenDisabled: string;
  warnWhen: "enabled" | "disabled";
};

const ToggleCard = ({
  title,
  enabled,
  onToggle,
  whenEnabled,
  whenDisabled,
  warnWhen,
  className,
  ...props
}: ToggleCardProps) => {
  const isWarning = enabled === (warnWhen === "enabled");

  return (
    <Card
      onClick={onToggle}
      className={cn(
        "w-full flex justify-between items-center gap-4 pr-6 py-3 text-left cursor-pointer select-none",
        className
      )}
      {...props}
    >
      <div>
        <p>{title}</p>
        <p className={cn("text-sm", isWarning ? "text-destructive" : "text-muted")}>
          {enabled ? whenEnabled : whenDisabled}
        </p>
      </div>
      
      <Checkbox enabled={enabled} />
    </Card>
  );
};

export default ToggleCard;
