import { shuffleArray } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

const useShuffle = <T>(items: T[], consumed: number) => {
  const [order, setOrder] = useState<number[]>([]);

  if (order.length !== items.length) {
    setOrder((prev) => {
      // remove the indices that become out of bounds when items shrink
      if (items.length < prev.length) {
        return prev.filter((index) => index < items.length);
      }

      // append new indices when items grow
      const overflow = items.length - prev.length;
      const offset = prev.length;
      return [...prev, ...Array.from({ length: overflow }, (_, index) => index + offset)];
    });
  }

  const shuffle = useCallback(() => {
    setOrder((prev) => [...prev.slice(0, consumed), ...shuffleArray(prev.slice(consumed))]);
  }, [consumed]);

  const shuffledItems = useMemo(() => {
    return order.map((index) => items[index]);
  }, [order, items]);

  return { items: shuffledItems, shuffle };
};

export default useShuffle;
