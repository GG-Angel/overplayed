import { useRef, useState } from "react";
import type { ReviewForm } from "./useReviewForm";
import { createNewPlaylist, updatePlaylistItems } from "@/lib/api";
import type { Playlist } from "@/lib/types";

export type StepStatus = "pending" | "active" | "success" | "error" | "skipped";

type SubmitState = {
  creating: StepStatus;
  backingUp: StepStatus;
  removing: StepStatus;
  error: Error | null;
  newPlaylist: Playlist | null;
};

const initialState: SubmitState = {
  creating: "pending",
  backingUp: "pending",
  removing: "pending",
  error: null,
  newPlaylist: null,
};

const useSubmitChanges = (playlistId: string) => {
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
          backingUp: "active",
          newPlaylist,
        }));

        await updatePlaylistItems(newPlaylist.id, uris, "add");
        setState((s) => ({ ...s, backingUp: "success" }));
      } else {
        setState((s) => ({ ...s, creating: "skipped", backingUp: "skipped" }));
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
        backingUp: s.backingUp === "active" ? "error" : s.backingUp,
        removing: s.removing === "active" ? "error" : s.removing,
        error,
      }));
    }
  };

  return { state, submit };
};

export default useSubmitChanges;
