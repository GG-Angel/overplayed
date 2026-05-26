import Button from "@/components/ui/Button";
import { useSwipeContext } from "../context/SwipeContext";
import MessageState from "@/components/states/MessageState";

const NoChangesView = () => {
  const { back, goHome } = useSwipeContext();

  return (
    <MessageState
      kaomoji="ദ്ദി(｡•̀ ,<)~✩‧₊"
      title="Nothing to Remove!"
      subtitle={
        <>
          <p>You kept every track, so your playlist stays as is.</p>
          <p className="text-sm text-muted-foreground">(your playlist must be really good)</p>
        </>
      }
      actions={
        <>
          <Button variant="secondary" onClick={back}>
            Keep Swiping
          </Button>
          <Button variant="primary" onClick={goHome}>
            Return Home
          </Button>
        </>
      }
    />
  );
};

export default NoChangesView;
