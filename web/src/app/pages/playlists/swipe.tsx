import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { useState } from "react";
import ErrorState from "@/components/states/ErrorState";
import type { ReviewForm } from "@/features/swipe/hooks/useReviewForm";
import { useSwipeContext } from "@/features/swipe/context/SwipeContext";
import SwipeProvider from "@/features/swipe/context/SwipeProvider";
import NothingView from "@/features/swipe/views/NothingView";
import ReviewView from "@/features/swipe/views/ReviewView";
import SubmitView from "@/features/swipe/views/SubmitView";
import SwipeView from "@/features/swipe/views/SwipeView";

type PhaseState =
  | { kind: "swipe" }
  | { kind: "nothing" }
  | { kind: "review" }
  | { kind: "submit"; form: ReviewForm };

const SwipePage = () => {
  const { playlistId } = useParams();

  if (!playlistId) return <ErrorState message="Playlist not found" />;

  return (
    <SwipeProvider playlistId={playlistId}>
      <SwipePageInner />
    </SwipeProvider>
  );
};

const SwipePageInner = () => {
  const [phase, setPhase] = useState<PhaseState>({ kind: "swipe" });

  const { status, total, dislikes } = useSwipeContext();
  const navigate = useNavigate();

  const handleHome = () => {
    navigate("/", { replace: true });
  };

  const handleFinish = () => {
    setPhase({ kind: dislikes.length === 0 ? "nothing" : "review" });
  };

  const handleSubmit = (form: ReviewForm) => {
    setPhase({ kind: "submit", form });
  };

  const backToSwipe = () => setPhase({ kind: "swipe" });

  if (status === "error") return <ErrorState message="Failed to load playlist" />;
  if (status === "loading") return <LoadingState message="Loading tracks..." />;
  if (total === 0) return <ErrorState message="Playlist is empty" />;

  switch (phase.kind) {
    case "swipe":
      return <SwipeView onFinish={handleFinish} />;
    case "nothing":
      return <NothingView onBack={backToSwipe} onHome={handleHome} />;
    case "review":
      return <ReviewView onBack={backToSwipe} onSubmit={handleSubmit} />;
    case "submit":
      return <SubmitView form={phase.form} />;
  }
};

export default SwipePage;
