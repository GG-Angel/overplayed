import { shuffleArray } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

/**
 * Reorders `items` by a shuffled index list, leaving the first `consumed`
 * entries in place. Items that arrive after a shuffle keep their natural order
 * until the next one, so `order` only ever needs to cover the items seen so far.
 */
const useShuffle = <T>(items: T[], consumed: number) => {
  const [order, setOrder] = useState<number[]>([]);

  const shuffle = useCallback(() => {
    setOrder((prev) => {
      // absorb the natural-order tail of items that arrived since the last shuffle
      const full = [...prev, ...items.slice(prev.length).map((_, index) => prev.length + index)];
      return [...full.slice(0, consumed), ...shuffleArray(full.slice(consumed))];
    });
  }, [consumed, items]);

  const shuffledItems = useMemo(
    () => [...order.map((index) => items[index]), ...items.slice(order.length)],
    [order, items]
  );

  return { items: shuffledItems, shuffle };
};

export default useShuffle;
