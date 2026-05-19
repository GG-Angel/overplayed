import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import type { Playlist } from "@/lib/types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSwipeContext } from "../context/SwipeContext";
import type { ReviewForm } from "../hooks/useReviewForm";
import NoChangesView from "./NoChangesView";
import ReviewView from "./ReviewView";
import SubmitView from "./SubmitView";
import SuccessView from "./SuccessView";
import SwipeView from "./SwipeView";

type PhaseState =
  | { kind: "swipe" }
  | { kind: "nothing" }
  | { kind: "review" }
  | { kind: "submit"; form: ReviewForm }
  | { kind: "success"; newPlaylist: Playlist | null }
  | { kind: "error"; error: Error | null };

const SwipeStateHandler = () => {
  const [phase, setPhase] = useState<PhaseState>({ kind: "swipe" });
  const { status, total, dislikes } = useSwipeContext();
  const navigate = useNavigate();

  const backToSwipe = () => setPhase({ kind: "swipe" });
  const handleHome = () => navigate("/", { replace: true });

  const handleFinish = () => setPhase({ kind: dislikes.length === 0 ? "nothing" : "review" });
  const handleSubmit = (form: ReviewForm) => setPhase({ kind: "submit", form });

  const handleError = (error: Error | null) => setPhase({ kind: "error", error });
  const handleSuccess = (newPlaylist: Playlist | null) =>
    setPhase({ kind: "success", newPlaylist });

  if (status === "error") return <ErrorState message="Failed to load playlist" />;
  if (status === "loading") return <LoadingState message="Loading tracks..." />;
  if (total === 0) return <ErrorState message="Playlist is empty" />;

  switch (phase.kind) {
    case "swipe":
      return <SwipeView onFinish={handleFinish} />;
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
      return <ErrorState message="Something went wrong" />;
  }
};

export default SwipeStateHandler;
