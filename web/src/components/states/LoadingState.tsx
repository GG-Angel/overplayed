import { Spinner } from "@/components/ui/Spinner";

type LoadingStateProps = {
  message?: string;
};

const LoadingState = ({ message = "Loading..." }: LoadingStateProps) => {
  return (
    <div className="h-full flex flex-col gap-2 items-center justify-center">
      <Spinner />
      <p className="font-medium text-muted-foreground text-lg">{message}</p>
    </div>
  );
};

export default LoadingState;
