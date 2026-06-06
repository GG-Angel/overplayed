import { useNavigate } from "react-router-dom";
import MessageState from "./MessageState";
import Button from "../ui/Button";

type ErrorStateProps = {
  message?: string;
};

const ErrorState = ({ message = "Unexpected Error" }: ErrorStateProps) => {
  const navigate = useNavigate();

  return (
    <MessageState
      kaomoji="(๑•̀ᗝ•́)૭"
      tone="danger"
      title={message}
      actions={
        <Button variant="tertiary" onClick={() => navigate("/", { replace: true })}>
          Return Home
        </Button>
      }
    />
  );
};

export default ErrorState;
