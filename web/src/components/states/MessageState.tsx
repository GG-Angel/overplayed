import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import Button, { type ButtonProps } from "../ui/Button";
import type { IconComponent } from "@/types/icon";

const MESSAGE_TONES = {
  neutral: "text-muted",
  negative: "text-destructive",
  positive: "text-success",
} as const;

export type MessageAction = {
  label: string;
  onClick: () => void;
  icon?: IconComponent;
  variant?: ButtonProps["variant"];
};

type MessageStateProps = {
  kaomoji: string;
  title: string;
  subtitle?: ReactNode;
  /** Falsy entries are dropped, so conditional actions can stay inline. */
  actions?: (MessageAction | false | null | undefined)[];
  tone?: keyof typeof MESSAGE_TONES;
};

const MessageState = ({
  kaomoji,
  title,
  subtitle,
  actions,
  tone = "neutral",
}: MessageStateProps) => {
  const shownActions = actions?.filter((action): action is MessageAction => !!action) ?? [];

  return (
    <main className="flex flex-col h-full justify-center gap-4">
      <div className="text-center">
        <p className={cn("text-4xl xs:text-5xl font-bold", MESSAGE_TONES[tone])}>{kaomoji}</p>
        <p className="heading-3 mt-2">{title}</p>
        {subtitle}
      </div>
      {shownActions.length > 0 && (
        <div className="grid grid-cols-1 xs:grid-flow-col xs:auto-cols-fr gap-2 *:w-full w-full max-w-lg self-center">
          {shownActions.map(({ label, onClick, icon, variant }) => (
            <Button key={label} icon={icon} variant={variant} onClick={onClick}>
              {label}
            </Button>
          ))}
        </div>
      )}
    </main>
  );
};

export default MessageState;
