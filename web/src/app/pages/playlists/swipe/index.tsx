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

type Phase = "swipe" | "nothing" | "review" | "submit";

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
  const [phase, setPhase] = useState<Phase>("swipe");
  const { status, total, dislikes } = useSwipeContext();
  const navigate = useNavigate();

  const handleHome = () => {
    navigate("/", { replace: true });
  };

  const handleFinish = () => {
    const nextPhase = dislikes.length === 0 ? "nothing" : "review";
    setPhase(nextPhase);
  };

  const handleSubmit = (form: ReviewForm) => {
    // TODO: validate conditions for submitting
    console.log(form);
    setPhase("submit");
  };

  if (status === "error") return <ErrorState message="Failed to load playlist" />;
  if (status === "loading") return <LoadingState message="Loading tracks..." />;
  if (total === 0) return <ErrorState message="Playlist is empty" />;

  switch (phase) {
    case "swipe":
      return <SwipeView onFinish={handleFinish} />;
    case "nothing":
      return <NothingView onBack={() => setPhase("swipe")} onHome={handleHome} />;
    case "review":
      return <ReviewView onBack={() => setPhase("swipe")} onSubmit={handleSubmit} />;
    case "submit":
      return <SubmitView />;
  }
};

export default PlaylistSwipePage;
