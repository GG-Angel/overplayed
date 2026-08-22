import { useNavigate } from "react-router-dom";
import MessageState from "./MessageState";
import Button from "../ui/Button";
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
      actions={
        <Button icon={Undo2} variant="tertiary" onClick={() => navigate("/", { replace: true })}>
          Return Home
        </Button>
      }
    />
  );
};

export default ErrorState;
