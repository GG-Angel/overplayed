import { Spinner } from "@/components/ui/Spinner";

const LoadingState = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <Spinner />
    </div>
  );
};

export default LoadingState;
