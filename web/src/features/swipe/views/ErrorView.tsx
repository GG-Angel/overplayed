import Button from "@/components/ui/Button";
import { useSwipeContext } from "../context/SwipeContext";
import MessageState from "../../../components/states/MessageState";

const ErrorView = () => {
  const { finish, goHome } = useSwipeContext();

  return (
    <MessageState
      kaomoji="(ᵕ ó ᴗ ò)"
      title="Submission Failed"
      subtitle={
        <>
          <p>One of the submission phases failed.</p>
          <p className="text-sm text-muted-foreground">We recommend trying again.</p>
        </>
      }
      actions={
        <>
          <Button variant="secondary" onClick={goHome}>
            Return Home
          </Button>
          <Button variant="primary" onClick={finish}>
            Try Again
          </Button>
        </>
      }
    />
  );
};

export default ErrorView;
