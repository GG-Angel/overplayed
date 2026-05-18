import { useMemo, useState } from "react";

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

  const { likes, dislikes } = useMemo(() => {
    const likes: T[] = [];
    const dislikes: T[] = [];
    for (const s of swipes) {
      (s.decision === "like" ? likes : dislikes).push(s.item);
    }
    return { likes, dislikes };
  }, [swipes]);

  return { swipes, likes, dislikes, record, undo, reset };
};

export default useSwipes;
