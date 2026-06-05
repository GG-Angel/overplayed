import type { ReactNode } from "react";

type MessageStateProps = {
  kaomoji: string;
  title: string;
  subtitle?: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
};

const MessageState = ({ kaomoji, title, subtitle, body, actions }: MessageStateProps) => {
  return (
    <div className="flex flex-col h-full justify-center gap-6">
      <div className="text-center">
        <p className="text-4xl text-primary">{kaomoji}</p>
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
