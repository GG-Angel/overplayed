import { lazy, useCallback, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import WaveformSkeleton from "./WaveformSkeleton";
import VolumeControl from "./VolumeControl";
import type { WaveformHandler } from "./Waveform";
import type { TrackPreview } from "@/lib/types";

const Waveform = lazy(() => import("./Waveform"));

const DEFAULT_VOLUME = 0.5;

type PreviewPlayerProps = {
  preview: TrackPreview | null | undefined;
  isLoading: boolean;
  isError: boolean;
  className?: string;
};

const AudioPlayer = ({ preview, isLoading, isError, className }: PreviewPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const waveformRef = useRef<WaveformHandler>(null);
  const showWaveform = !isLoading && !isError && preview?.url;

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => setIsPlaying(false), []);

  return (
    <Card padding="sm" className={cn("flex items-center gap-3 overflow-visible py-2", className)}>
      <IconButton
        size="xs"
        variant="green"
        icon={isPlaying && preview?.url ? Pause : Play}
        disabled={!isPlaying && !preview?.url}
        onClick={() => waveformRef.current?.playPause()}
      />
      <div className="relative flex-1 self-stretch">
        <Waveform
          url={preview?.url}
          waveformRef={waveformRef}
          volume={volume}
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
                return "play to listen!";
              }
            })()}
            pulse={isLoading}
          />
        )}
      </div>
      <VolumeControl volume={volume} onVolumeChange={setVolume} />
    </Card>
  );
};

export default AudioPlayer;
