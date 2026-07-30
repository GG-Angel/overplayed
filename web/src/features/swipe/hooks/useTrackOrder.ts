import { useCallback, useMemo, useState } from "react";
import { shuffleArray } from "@/lib/utils";

/**
 * Layers a permutation of indices over the loaded tracks so the deck can be reordered
 * without touching the query cache. Positions the user has already been served aren't
 * mutated, which keeps their decisions and undos pointing at the right tracks.
 */
const useTrackOrder = <T>(tracks: T[], consumed: number) => {
  const [order, setOrder] = useState<number[]>([]);

  // keep the permutation sized to the loaded pages; a new page appends in playlist order
  if (order.length !== tracks.length) {
    setOrder((prev) =>
      tracks.length < prev.length
        ? prev.filter((index) => index < tracks.length)
        : [
            ...prev,
            ...Array.from({ length: tracks.length - prev.length }, (_, i) => prev.length + i),
          ]
    );
  }

  const shuffle = useCallback(() => {
    setOrder((prev) => [...prev.slice(0, consumed), ...shuffleArray(prev.slice(consumed))]);
  }, [consumed]);

  const orderedTracks = useMemo(() => order.map((index) => tracks[index]), [order, tracks]);

  return { tracks: orderedTracks, shuffle };
};

export default useTrackOrder;
