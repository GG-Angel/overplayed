import type { Playlist } from "@/lib/types";
import type { ReviewForm } from "./useReviewForm";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type PhaseState =
  | { kind: "swipe" }
  | { kind: "nothing" }
  | { kind: "review" }
  | { kind: "submit"; form: ReviewForm }
  | { kind: "success"; newPlaylist: Playlist | null }
  | { kind: "error" };

const initialPhase: PhaseState = { kind: "swipe" };

const useSwipePhase = () => {
  const [phase, setPhase] = useState<PhaseState>(initialPhase);
  const navigate = useNavigate();

  const backToSwipe = () => {
    setPhase({ kind: "swipe" });
  };

  const handleHome = () => {
    navigate("/", { replace: true });
  };

  const handleFinish = (dislikes: number) => {
    setPhase({ kind: dislikes === 0 ? "nothing" : "review" });
  };

  const handleSubmit = (form: ReviewForm) => {
    setPhase({ kind: "submit", form });
  };

  const handleError = () => {
    setPhase({ kind: "error" });
  };

  const handleSuccess = (newPlaylist: Playlist | null) => {
    setPhase({ kind: "success", newPlaylist });
  };

  return { phase, backToSwipe, handleHome, handleFinish, handleSubmit, handleError, handleSuccess };
};

export default useSwipePhase;
