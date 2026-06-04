import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SwipeContext, type PhaseState, type SwipeContextValue } from "./SwipeContext";
import { useSwipePlaylist } from "../hooks/useSwipePlaylist";
import type { SwipeForm } from "../hooks/useSwipeForm";
import type { PlaylistMetadata } from "@/lib/types";
import useTimer from "@/hooks/useTimer";
import { logSwipeSession } from "@/lib/api";

type SwipeProviderProps = {
  playlistId: string;
  children?: ReactNode;
};

const SwipeProvider = ({ playlistId, children }: SwipeProviderProps) => {
  const [phase, setPhase] = useState<PhaseState>({ kind: "swipe" });
  const navigate = useNavigate();
  const swipe = useSwipePlaylist(playlistId);
  const timer = useTimer();

  const { total, swipes, dislikes } = swipe;

  const finish = () => setPhase({ kind: dislikes.length === 0 ? "nothing" : "review" });
  const submit = (form: SwipeForm) => setPhase({ kind: "submit", form });
  const succeed = (newPlaylist: PlaylistMetadata | null) =>
    setPhase({ kind: "success", newPlaylist });
  const fail = () => setPhase({ kind: "error" });
  const back = () => setPhase({ kind: "swipe" });
  const goHome = () => navigate("/", { replace: true });

  // log session on completion
  useEffect(() => {
    if (phase.kind !== "success" || total === undefined) return;
    logSwipeSession({
      playlist_id: playlistId,
      total_tracks: total,
      tracks_swiped: swipes.length,
      tracks_cut: dislikes.length,
      started_at: timer.stop().startedAt,
    });
  }, [phase.kind, playlistId, total, swipes.length, dislikes.length, timer]);

  const value: SwipeContextValue = {
    ...swipe,
    phase,
    finish,
    submit,
    succeed,
    fail,
    back,
    goHome,
  };

  return <SwipeContext.Provider value={value}>{children}</SwipeContext.Provider>;
};

export default SwipeProvider;
