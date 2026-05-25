import Button from "@/components/ui/Button";
import { useSwipeContext } from "../context/SwipeContext";

const ErrorView = () => {
  const { finish, goHome } = useSwipeContext();

  return (
    <div className="flex flex-col h-full justify-center gap-6">
      <div className="text-center">
        <p className="text-4xl mb-2 text-primary">{"(ᵕ ó ᴗ ò)"}</p>
        <p className="text-xl font-medium">Submission Failed</p>
        <p>One of the submission phases failed.</p>
        <p className="text-sm">We recommend trying again.</p>
      </div>
      <div className="flex justify-center gap-2">
        <Button variant="secondary" onClick={goHome}>
          Return Home
        </Button>
        <Button variant="primary" onClick={finish}>
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default ErrorView;
