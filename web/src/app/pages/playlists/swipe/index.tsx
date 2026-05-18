import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { useState } from "react";
import ErrorState from "@/components/states/ErrorState";
import SwipeView from "./SwipeView";
import ReviewView from "./ReviewView";
import SwipeProvider from "./SwipeProvider";
import { useSwipeContext } from "./SwipeContext";
import NothingView from "./NothingView";
import type { ReviewForm } from "@/hooks/useReviewForm";
import SubmitView from "./SubmitView";

type PhaseState =
  | { kind: "swipe" }
  | { kind: "nothing" }
  | { kind: "review" }
  | { kind: "submit"; form: ReviewForm };

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();

  if (!playlistId) return <ErrorState message="Playlist not found" />;

  return (
    <SwipeProvider playlistId={playlistId}>
      <PlaylistSwipePageInner />
    </SwipeProvider>
  );
};

const PlaylistSwipePageInner = () => {
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

export default PlaylistSwipePage;
