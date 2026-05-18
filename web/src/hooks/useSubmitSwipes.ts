import { useCallback, useState } from "react";
import type { ReviewForm } from "./useReviewForm";
import type { Track } from "@/lib/types";

type SubmitStatus =
  | { status: "idle" }
  | { status: "submitting"; step: "creating" | "adding" | "removing" }
  | { status: "success" }
  | { status: "error"; error: Error };

const useSubmitSwipes = (playlistId: string) => {
  const [status, setStatus] = useState<SubmitStatus>({ status: "idle" });

  const submit = async (form: ReviewForm, dislikedTracks: Track[]) => {
    
  };
};

export default useSubmitSwipes;
