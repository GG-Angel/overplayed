import { Spinner } from "@/components/ui/Spinner";

type LoadingStateProps = {
  message?: string;
};

const LoadingState = ({ message = "Loading..." }: LoadingStateProps) => {
  return (
    <div className="flex flex-col h-full gap-2 justify-center items-center">
      <Spinner size="lg" />
      <p className="font-medium text-muted text-lg">{message}</p>
    </div>
  );
};

export default LoadingState;
