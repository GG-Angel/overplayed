import { useState } from "react";

export type Decision = "like" | "dislike";

export type Swipe = {
  id: string;
  decision: Decision;
};

const useSwipeDecisions = () => {
  const [swipes, setSwipes] = useState<Swipe[]>([]);

  const record = (id: string, decision: Decision) =>
    setSwipes((prev) => [...prev, { id, decision }]);

  const undo = () => setSwipes((prev) => prev.slice(0, -1));

  const reset = () => setSwipes([]);

  const likes = swipes.filter((s) => s.decision === "like").length;
  const dislikes = swipes.length - likes;

  return { swipes, likes, dislikes, record, undo, reset };
};

export default useSwipeDecisions;
