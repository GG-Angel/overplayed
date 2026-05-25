import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { useSwipeContext } from "../context/SwipeContext";
import NoChangesView from "./NoChangesView";
import ReviewView from "./ReviewView";
import SubmitView from "./SubmitView";
import SuccessView from "./SuccessView";
import SwipeView from "./SwipeView";
import ErrorView from "./ErrorView";

const SwipeStateHandler = () => {
  const { status, total, phase } = useSwipeContext();

  if (status === "error") return <ErrorState message="Failed to load playlist" />;
  if (status === "loading") return <LoadingState message="Loading tracks..." />;
  if (total === 0) return <ErrorState message="Playlist is empty" />;

  switch (phase.kind) {
    case "swipe":
      return <SwipeView />;
    case "nothing":
      return <NoChangesView />;
    case "review":
      return <ReviewView />;
    case "submit":
      return <SubmitView form={phase.form} />;
    case "success":
      return <SuccessView newPlaylist={phase.newPlaylist} />;
    case "error":
      return <ErrorView />;
  }
};

export default SwipeStateHandler;
