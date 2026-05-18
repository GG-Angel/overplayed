import { useRef, useState } from "react";
import type { ReviewForm } from "./useReviewForm";
import { createNewPlaylist, updatePlaylistItems } from "@/lib/api";
import type { Playlist } from "@/lib/types";

export type StepStatus = "pending" | "active" | "success" | "error" | "skipped";
type StepName = "creating" | "backingUp" | "removing";
type SubmitPhase = "idle" | "running" | "done" | "failed";

type SubmitState = {
  phase: SubmitPhase;
  creating: StepStatus;
  backingUp: StepStatus;
  removing: StepStatus;
  error: Error | null;
  newPlaylist: Playlist | null;
};

const initialState: SubmitState = {
  phase: "idle",
  creating: "pending",
  backingUp: "pending",
  removing: "pending",
  error: null,
  newPlaylist: null,
};

const useSubmitChanges = (currentPlaylistId: string) => {
  const [state, setState] = useState<SubmitState>(initialState);
  const hasSubmitted = useRef(false);

  const runStep = async <T>(name: StepName, fn: () => Promise<T>): Promise<T> => {
    setState((s) => ({ ...s, [name]: "active" }));
    const result = await fn();
    setState((s) => ({ ...s, [name]: "success" }));
    return result;
  };

  const submit = async (form: ReviewForm, uris: string[]) => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    setState((s) => ({ ...s, phase: "running" }));

    try {
      // create new playlist, back up removed tracks to it
      if (form.savePlaylist) {
        const newPlaylist = await runStep("creating", createNewPlaylist);
        setState((s) => ({ ...s, newPlaylist }));
        await runStep("backingUp", () => updatePlaylistItems(newPlaylist.id, uris, "add"));
      } else {
        setState((s) => ({ ...s, creating: "skipped", backingUp: "skipped" }));
      }
      // remove tracks from original playlist
      await runStep("removing", () => updatePlaylistItems(currentPlaylistId, uris, "remove"));
      setState((s) => ({ ...s, phase: "done" }));
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState((s) => {
        const names: StepName[] = ["creating", "backingUp", "removing"];
        const updates = Object.fromEntries(
          names.map((n) => [n, s[n] === "active" ? "error" : s[n]])
        );
        return { ...s, ...updates, phase: "failed", error };
      });
    }
  };

  return { state, submit };
};
export default useSubmitChanges;
