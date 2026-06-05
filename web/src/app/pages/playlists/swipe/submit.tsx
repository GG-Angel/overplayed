import Button from "@/components/ui/Button";
import useSubmitSwipes from "@/features/swipe/hooks/useSubmitSwipes";

const SwipeSubmitPage = () => {
  const controller = useSubmitSwipes();

  return (
    <div>
      <Button onClick={controller.start}>Start submission</Button>
      <p>Phase: {controller.phase ?? "Setting up..."}</p>
      <p>
        Success: {String(controller.isSuccess)} Error: {String(controller.isError)}
      </p>
    </div>
  );
};

export default SwipeSubmitPage;
