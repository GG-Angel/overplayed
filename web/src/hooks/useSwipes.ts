import { useState } from "react";

export type Decision = "like" | "dislike";

export type Swipe<T> = {
  item: T;
  decision: Decision;
};

const useSwipes = <T>() => {
  const [swipes, setSwipes] = useState<Swipe<T>[]>([]);

  const record = (item: T, decision: Decision) =>
    setSwipes((prev) => [...prev, { item, decision }]);

  const undo = () => setSwipes((prev) => prev.slice(0, -1));

  const reset = () => setSwipes([]);

  const likes = swipes.filter((s) => s.decision === "like").map((s) => s.item);
  const dislikes = swipes.filter((s) => s.decision === "dislike").map((s) => s.item);

  return { swipes, likes, dislikes, record, undo, reset };
};

export default useSwipes;
