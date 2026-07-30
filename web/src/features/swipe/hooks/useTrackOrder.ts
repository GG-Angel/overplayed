import { useCallback, useMemo, useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { shuffle } from "@/lib/utils";

const STORED_SHUFFLE_KEY = "shuffle";
const DEFAULT_SHUFFLE = false;

// how many upcoming positions stay frozen when the order is rebuilt underneath the
// deck. must be >= MAX_CARD_STACK_HEIGHT so no visible card is swapped out mid-view.
const LOCKED_LOOKAHEAD = 3;

/**
 * Builds a permutation of `[0, total)` as `[locked head] + [tail]`. The head keeps the
 * positions the user has already been served so their decisions and undos stay intact;
 * the tail is every remaining index, shuffled or in ascending playlist order.
 */
const buildOrder = (
  previous: number[],
  locked: number,
  total: number,
  shuffled: boolean
): number[] => {
  const head = previous.slice(0, locked).filter((index) => index < total);
  const served = new Set(head);

  const tail: number[] = [];
  for (let index = 0; index < total; index++) {
    if (!served.has(index)) tail.push(index);
  }

  return [...head, ...(shuffled ? shuffle(tail) : tail)];
};

const useTrackOrder = <T>(tracks: T[], consumed: number) => {
  const [isShuffled, setIsShuffled] = useLocalStorage(STORED_SHUFFLE_KEY, DEFAULT_SHUFFLE);
  const [order, setOrder] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(0);

  // a new page landed, so fold it into the tracks the user hasn't seen yet. rebuilding
  // during render lets react re-run us before painting, so the deck never shows a stale
  // order the way it would if we waited for an effect.
  if (loaded !== tracks.length) {
    setLoaded(tracks.length);
    setOrder((prev) => buildOrder(prev, consumed + LOCKED_LOOKAHEAD, tracks.length, isShuffled));
  }

  const toggleShuffle = useCallback(() => {
    const next = !isShuffled;
    setIsShuffled(next);
    // only lock the card being previewed, so the reorder is immediately visible
    setOrder((prev) => buildOrder(prev, consumed + 1, tracks.length, next));
  }, [isShuffled, setIsShuffled, consumed, tracks.length]);

  const orderedTracks = useMemo(() => order.map((index) => tracks[index]), [order, tracks]);

  return { tracks: orderedTracks, isShuffled, toggleShuffle };
};

export default useTrackOrder;
