import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const MESSAGE_TONES = {
  neutral: "text-muted",
  negative: "text-destructive",
  positive: "text-success",
} as const;

type MessageStateProps = {
  kaomoji: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  tone?: keyof typeof MESSAGE_TONES;
};

const MessageState = ({
  kaomoji,
  title,
  subtitle,
  actions,
  tone = "neutral",
}: MessageStateProps) => {
  return (
    <main className="flex flex-col h-full justify-center gap-4">
      <div className="text-center">
        <p className={cn("text-4xl xs:text-5xl font-bold", MESSAGE_TONES[tone])}>{kaomoji}</p>
        <p className="heading-2 mt-2">{title}</p>
        {subtitle}
      </div>
      {actions && (
        <div className="grid grid-cols-1 xs:grid-flow-col xs:auto-cols-fr gap-2 *:w-full w-full max-w-lg self-center">
          {actions}
        </div>
      )}
    </main>
  );
};

export default MessageState;
