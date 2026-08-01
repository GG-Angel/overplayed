import { useCallback, useMemo, useState } from "react";

export type SwipeDecision = "like" | "dislike";

export type Swipe<T> = {
  item: T;
  decision: SwipeDecision;
};

const useSwipes = <T>(initialSwipes: Swipe<T>[] = []) => {
  const [swipes, setSwipes] = useState<Swipe<T>[]>(initialSwipes);

  const { likes, dislikes } = useMemo(() => {
    const likes: T[] = [];
    const dislikes: T[] = [];
    for (const s of swipes) {
      (s.decision === "like" ? likes : dislikes).push(s.item);
    }
    return { likes, dislikes };
  }, [swipes]);

  const recordSwipe = useCallback((swipe: Swipe<T>) => {
    setSwipes((prev) => [...prev, swipe]);
  }, []);

  const recordSwipes = useCallback((swipes: Swipe<T>[]) => {
    setSwipes((prev) => [...prev, ...swipes]);
  }, []);

  const undoSwipe = useCallback(() => setSwipes((prev) => prev.slice(0, -1)), []);

  return { swipes, likes, dislikes, recordSwipe, recordSwipes, undoSwipe };
};

export default useSwipes;
