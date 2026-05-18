import { useRef, useState } from "react";
import type { ReviewForm } from "./useReviewForm";
import { createNewPlaylist, updatePlaylistItems } from "@/lib/api";
import type { Playlist } from "@/lib/types";

export type StepStatus = "pending" | "active" | "success" | "error" | "skipped";

type SubmitState = {
  creating: StepStatus;
  adding: StepStatus;
  removing: StepStatus;
  error: Error | null;
  newPlaylist: Playlist | null;
};

const initialState: SubmitState = {
  creating: "pending",
  adding: "pending",
  removing: "pending",
  error: null,
  newPlaylist: null,
};

const useSubmitReview = (playlistId: string) => {
  const [state, setState] = useState<SubmitState>(initialState);
  const hasSubmitted = useRef(false);

  const submit = async (form: ReviewForm, uris: string[]) => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    try {
      if (form.savePlaylist) {
        setState((s) => ({ ...s, creating: "active" }));
        const newPlaylist = await createNewPlaylist();
        setState((s) => ({
          ...s,
          creating: "success",
          adding: "active",
          newPlaylist,
        }));

        await updatePlaylistItems(newPlaylist.id, uris, "add");
        setState((s) => ({ ...s, adding: "success" }));
      } else {
        setState((s) => ({ ...s, creating: "skipped", adding: "skipped" }));
      }

      setState((s) => ({ ...s, removing: "active" }));
      await updatePlaylistItems(playlistId, uris, "remove");
      setState((s) => ({ ...s, removing: "success" }));
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState((s) => ({
        ...s,
        // mark whichever step is currently active as errored
        creating: s.creating === "active" ? "error" : s.creating,
        adding: s.adding === "active" ? "error" : s.adding,
        removing: s.removing === "active" ? "error" : s.removing,
        error,
      }));
    }
  };

  return { state, submit };
};

export default useSubmitReview;
