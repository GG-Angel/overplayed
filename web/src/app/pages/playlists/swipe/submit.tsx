import Button from "@/components/ui/Button";
import useSubmitSwipes from "@/features/swipe/hooks/useSubmitSwipes";

const SwipeSubmitPage = () => {
  const handler = useSubmitSwipes();

  return (
    <div>
      <Button onClick={() => handler.mutate()}>Start submission</Button>
      <p>Phase: {handler.phase ?? "Setting up..."}</p>
      <p>
        Success: {String(handler.isSuccess)} Error: {String(handler.isError)}
      </p>
    </div>
  );
};

export default SwipeSubmitPage;
