import { useNavigate } from "react-router-dom";
import MessageState from "./MessageState";
import { Undo2 } from "lucide-react";
import { KAOMOJIS } from "@/lib/constants";

type ErrorStateProps = {
  message?: string;
};

const ErrorState = ({ message = "Unexpected error!" }: ErrorStateProps) => {
  const navigate = useNavigate();

  return (
    <MessageState
      kaomoji={KAOMOJIS.stressed}
      tone="negative"
      title={message}
      actions={[
        {
          label: "Return Home",
          icon: Undo2,
          variant: "tertiary",
          onClick: () => navigate("/", { replace: true }),
        },
      ]}
    />
  );
};

export default ErrorState;
