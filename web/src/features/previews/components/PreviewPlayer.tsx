import { useCallback, useRef, useState } from "react";
import { Pause, Play, Volume1, Volume2, VolumeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Waveform, { type WaveformHandler } from "./Waveform";
import WaveformSkeleton from "./WaveformSkeleton";

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
        <Waveform
          url={url}
          waveformRef={waveformRef}
          onPlay={useCallback(() => {
            setIsReady(true);
            setIsPlaying(true);
          }, [])}
          onPause={useCallback(() => setIsPlaying(false), [])}
          className={cn("absolute inset-0 min-w-1", !showWaveform && "invisible")}
        />
        {!showWaveform && <WaveformSkeleton className="absolute inset-0 z-10" />}
      </div>
      <IconButton
        size="xs"
        icon={VOLUME_STEPS[volumeIndex].icon}
        onClick={useCallback(() => {
          const next = (volumeIndex + 1) % VOLUME_STEPS.length;
          setVolumeIndex(next);
          waveformRef.current?.setVolume(VOLUME_STEPS[next].value);
        }, [volumeIndex])}
      />
    </Card>
  );
};

export default AudioPlayer;
