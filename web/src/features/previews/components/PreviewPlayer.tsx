import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { Pause, Play, Volume1, Volume2, VolumeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import WaveformSkeleton from "./WaveformSkeleton";
import type { WaveformHandler } from "./Waveform";

const Waveform = lazy(() => import("./Waveform"));

type PreviewPlayerProps = {
  url: string | null | undefined;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

const VOLUME_STEPS: { value: number; icon: LucideIcon }[] = [
  { value: 1.0, icon: Volume2 },
  { value: 0.5, icon: Volume1 },
  { value: 0, icon: VolumeOff },
] as const;

const AudioPlayer = ({ url, className }: PreviewPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [volumeIndex, setVolumeIndex] = useState(0);
  const waveformRef = useRef<WaveformHandler>(null);
  const showWaveform = isReady && (isPlaying || url);

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
        icon={isPlaying && url ? Pause : Play}
        disabled={!url}
        onClick={() => waveformRef.current?.playPause()}
      />
      <div className="relative flex-1 self-stretch">
        <Suspense fallback={<WaveformSkeleton className="absolute inset-0 z-10" />}>
          <Waveform
            url={url}
            waveformRef={waveformRef}
            onPlay={handlePlay}
            onPause={handlePause}
            className={cn("absolute inset-0 min-w-1", !showWaveform && "invisible")}
          />
          {!showWaveform && <WaveformSkeleton className="absolute inset-0 z-10" />}
        </Suspense>
      </div>
      <IconButton size="xs" icon={VOLUME_STEPS[volumeIndex].icon} onClick={cycleVolume} />
    </Card>
  );
};

export default AudioPlayer;
