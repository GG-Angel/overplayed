import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const messageTones = {
  neutral: "text-muted-foreground",
  danger: "text-destructive",
  success: "text-primary",
} as const;

type MessageStateProps = {
  kaomoji: string;
  title: string;
  subtitle?: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  tone?: keyof typeof messageTones;
};

const MessageState = ({
  kaomoji,
  title,
  subtitle,
  body,
  actions,
  tone = "neutral",
}: MessageStateProps) => {
  return (
    <div className="flex flex-col h-full justify-center gap-6">
      <div className="text-center">
        <p className={cn("text-4xl", messageTones[tone])}>{kaomoji}</p>
        <p className="text-xl font-medium mt-2">{title}</p>
        {subtitle}
      </div>
      {body}
      {actions && (
        <div className="grid grid-flow-col auto-cols-fr gap-2 *:w-full w-full max-w-lg self-center">
          {actions}
        </div>
      )}
    </div>
  );
};

export default MessageState;
