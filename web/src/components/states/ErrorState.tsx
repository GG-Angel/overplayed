import { useNavigate } from "react-router-dom";
import MessageState from "./MessageState";
import Button from "../ui/Button";
import { kaomojis } from "@/lib/kaomoji";
import { Undo2 } from "lucide-react";

type ErrorStateProps = {
  message?: string;
};

const ErrorState = ({ message = "Unexpected error!" }: ErrorStateProps) => {
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

export default ErrorState;
