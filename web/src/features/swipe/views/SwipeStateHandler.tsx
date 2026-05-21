import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { useSwipeContext } from "../context/SwipeContext";
import NoChangesView from "./NoChangesView";
import ReviewView from "./ReviewView";
import SubmitView from "./SubmitView";
import SuccessView from "./SuccessView";
import SwipeView from "./SwipeView";
import ErrorView from "./ErrorView";
import useSwipePhase from "../hooks/useSwipePhase";

const SwipeStateHandler = () => {
  const { status, total, dislikes } = useSwipeContext();
  const { phase, backToSwipe, handleHome, handleFinish, handleSubmit, handleError, handleSuccess } =
    useSwipePhase();

  if (status === "error") return <ErrorState message="Failed to load playlist" />;
  if (status === "loading") return <LoadingState message="Loading tracks..." />;
  if (total === 0) return <ErrorState message="Playlist is empty" />;

  switch (phase.kind) {
    case "swipe":
      return <SwipeView onFinish={() => handleFinish(dislikes.length)} />;
    case "nothing":
      return <NoChangesView onBack={backToSwipe} onHome={handleHome} />;
    case "review":
      return <ReviewView onBack={backToSwipe} onSubmit={handleSubmit} />;
    case "submit":
      return <SubmitView form={phase.form} onSuccess={handleSuccess} onError={handleError} />;
    case "success":
      return (
        <SuccessView
          newPlaylist={phase.newPlaylist}
          onHome={handleHome}
          dislikes={dislikes.length}
          total={total}
        />
      );
    case "error":
      return <ErrorView onHome={handleHome} onRetry={() => handleFinish(dislikes.length)} />;
  }
};

export default SwipeStateHandler;
