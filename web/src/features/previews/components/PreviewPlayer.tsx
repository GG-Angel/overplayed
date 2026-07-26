import { lazy, useCallback, useRef, useState } from "react";
import { Pause, Play, Volume1, Volume2, VolumeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import WaveformSkeleton from "./WaveformSkeleton";
import type { WaveformHandler } from "./Waveform";
import type { TrackPreview } from "@/lib/types";

const Waveform = lazy(() => import("./Waveform"));

type PreviewPlayerProps = {
  preview: TrackPreview | null | undefined;
  isLoading: boolean;
  isError: boolean;
  className?: string;
};

const VOLUME_STEPS: { value: number; icon: LucideIcon }[] = [
  { value: 1.0, icon: Volume2 },
  { value: 0.5, icon: Volume1 },
  { value: 0, icon: VolumeOff },
] as const;

const AudioPlayer = ({ preview, isLoading, isError, className }: PreviewPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [volumeIndex, setVolumeIndex] = useState(0);
  const waveformRef = useRef<WaveformHandler>(null);
  const showWaveform = isReady && (isPlaying || preview?.url);

  const handlePlay = useCallback(() => {
    setIsReady(true);
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => setIsPlaying(false), []);

  const cycleVolume = useCallback(() => {
    setVolumeIndex((i) => {
      const next = (i + 1) % VOLUME_STEPS.length;
      waveformRef.current?.setVolume(VOLUME_STEPS[next].value);
      return next;
    });
  }, []);

  return (
    <Card padding="sm" className={cn("flex items-center gap-3 py-2", className)}>
      <IconButton
        size="xs"
        variant="green"
        icon={isPlaying && preview?.url ? Pause : Play}
        disabled={!preview?.url}
        onClick={() => waveformRef.current?.playPause()}
      />
      <div className="relative flex-1 self-stretch">
        <Waveform
          url={preview?.url}
          waveformRef={waveformRef}
          onPlay={handlePlay}
          onPause={handlePause}
          className={cn("absolute inset-0 min-w-1", !showWaveform && "invisible")}
        />
        {!showWaveform && (
          <WaveformSkeleton
            className="absolute inset-0 z-10"
            message={(() => {
              if (isLoading) {
                return "loading...";
              } else if (isError) {
                return "failed to load preview :(";
              } else if (!preview?.url) {
                return "no preview :(";
              } else {
                return "press play to listen!";
              }
            })()}
            pulse={isLoading}
          />
        )}
      </div>
      <IconButton size="xs" icon={VOLUME_STEPS[volumeIndex].icon} onClick={cycleVolume} />
    </Card>
  );
};

export default AudioPlayer;
