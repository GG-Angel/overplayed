import { cn } from "@/lib/utils";
import Card, { type CardButtonProps } from "./Card";
import Checkbox from "./Checkbox";

export type ToggleCardProps = Omit<CardButtonProps, "children" | "as" | "onClick"> & {
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
      as="button"
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
      className={cn(
        "w-full flex justify-between items-center gap-4 pr-6 py-3 text-left cursor-pointer select-none",
        className
      )}
      {...props}
    >
      <span>
        <span className="block">{title}</span>
        <span className={cn("block text-sm", isWarning ? "text-destructive" : "text-muted")}>
          {enabled ? whenEnabled : whenDisabled}
        </span>
      </span>
      <Checkbox enabled={enabled} />
    </Card>
  );
};

export default ToggleCard;
