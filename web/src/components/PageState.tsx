import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { cn, kaomojis } from "../utils";
import Button from "./ui/Button";
import { Spinner } from "./ui/Spinner";

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

export const MessageState = ({
  kaomoji,
  title,
  subtitle,
  actions,
  tone = "neutral",
}: MessageStateProps) => (
  <main className="flex flex-col h-full justify-center gap-4">
    <div className="text-center">
      <p className={cn("text-4xl xs:text-5xl font-bold", MESSAGE_TONES[tone])}>{kaomoji}</p>
      <p className="heading-3 mt-2">{title}</p>
      {subtitle}
    </div>
    {actions && (
      <div className="grid grid-cols-1 xs:grid-flow-col xs:auto-cols-fr gap-2 *:w-full w-full max-w-lg self-center">
        {actions}
      </div>
    )}
  </main>
);

export const LoadingState = ({ message = "Loading..." }: { message?: string }) => (
  <main className="flex flex-col h-full gap-2 justify-center items-center">
    <Spinner size="lg" />
    <p className="font-medium text-muted text-lg">{message}</p>
  </main>
);

export const ErrorState = ({ message = "Unexpected error!" }: { message?: string }) => {
  const navigate = useNavigate();
  return (
    <MessageState
      kaomoji={kaomojis.stressed}
      tone="negative"
      title={message}
      actions={
        <Button
          icon={<Undo2 className="size-4" />}
          variant="tertiary"
          onClick={() => navigate("/", { replace: true })}
        >
          Return Home
        </Button>
      }
    />
  );
};
