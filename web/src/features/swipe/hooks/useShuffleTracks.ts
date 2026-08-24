import { shuffleArray } from "@/lib/utils";
import type { Track } from "@/types/spotify";
import { useCallback, useState } from "react";

const useShuffleTracks = (tracks: Track[], currentTrackIndex: number) => {
  const [indices, setIndices] = useState<number[]>([]);

  const shuffle = useCallback(() => {
    setIndices((prev) => {
      const newIndices = tracks.slice(prev.length).map((_, i) => prev.length + i);
      const merged = [...prev, ...newIndices];
      return [
        ...merged.slice(0, currentTrackIndex),
        ...shuffleArray(merged.slice(currentTrackIndex)),
      ];
    });
  }, [currentTrackIndex, tracks]);

  const shuffledTracks = [...indices.map((i) => tracks[i]), ...tracks.slice(indices.length)];

  return { tracks: shuffledTracks, shuffle };
};

export default useShuffleTracks;
