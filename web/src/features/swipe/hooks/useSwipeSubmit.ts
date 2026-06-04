import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { SwipeForm } from "./useSwipeForm";
import { createNewPlaylist, updatePlaylistItems } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import type { PlaylistMetadata } from "@/lib/types";

export type StepStatus = "pending" | "active" | "success" | "error" | "skipped";
type StepName = "creating" | "backingUp" | "removing";
type SubmitPhase = "idle" | "running" | "done" | "failed";

type SubmitState = {
  phase: SubmitPhase;
  creating: StepStatus;
  backingUp: StepStatus;
  removing: StepStatus;
  error: Error | null;
  newPlaylist: PlaylistMetadata | null;
};

const initialState: SubmitState = {
  phase: "idle",
  creating: "pending",
  backingUp: "pending",
  removing: "pending",
  error: null,
  newPlaylist: null,
};

const useSwipeSubmit = (
  currentPlaylistId: string,
  onSuccess: (playlist: PlaylistMetadata | null) => void = () => {},
  onFail: () => void = () => {},
  delay: number = 0
) => {
  const [state, setState] = useState<SubmitState>(initialState);
  const hasSubmitted = useRef(false);
  const queryClient = useQueryClient();

  const runStep = async <T>(name: StepName, fn: () => Promise<T>): Promise<T> => {
    setState((s) => ({ ...s, [name]: "active" }));
    const result = await fn();
    setState((s) => ({ ...s, [name]: "success" }));
    return result;
  };

  const submit = async (form: SwipeForm, uris: string[]) => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    setState((s) => ({ ...s, phase: "running" }));

    try {
      if (form.savePlaylist) {
        const newPlaylist = await runStep("creating", createNewPlaylist);
        setState((s) => ({ ...s, newPlaylist }));
        await runStep("backingUp", () => updatePlaylistItems(newPlaylist.id, uris, "add"));
      } else {
        setState((s) => ({ ...s, creating: "skipped", backingUp: "skipped" }));
      }

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
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all, exact: true }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.playlists.one(currentPlaylistId),
          exact: true,
        }),
      ]);
    }
  };

  // delay call to success/fail for presentation
  useEffect(() => {
    if (state.phase !== "done" && state.phase !== "failed") return;

    const submissionTimeout = setTimeout(() => {
      if (state.phase === "done") onSuccess(state.newPlaylist);
      if (state.phase === "failed") onFail();
    }, delay);

    return () => {
      clearTimeout(submissionTimeout);
    };
  }, [onSuccess, onFail, state.newPlaylist, state.phase, delay]);

  return { state, submit };
};
export default useSwipeSubmit;
