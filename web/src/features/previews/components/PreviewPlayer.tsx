import { useCallback, useRef, useState } from "react";
import { Pause, Play, Volume1, Volume2, VolumeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Waveform, { type WaveformHandler } from "./Waveform";
import WaveformSkeleton from "./WaveformSkeleton";

type PreviewPlayerProps = {
  url: string | undefined;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

type Volume = 0 | 0.5 | 1.0;

const volumeConfig: Record<Volume, { icon: LucideIcon }> = {
  0: { icon: VolumeOff },
  0.5: { icon: Volume1 },
  1.0: { icon: Volume2 },
};

const AudioPlayer = ({ url, className }: PreviewPlayerProps) => {
  const waveformRef = useRef<WaveformHandler>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState<Volume>(1.0);
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
      <IconButton size="xs" icon={volumeConfig[volume].icon} />
    </Card>
  );
};

// TODO: change all -muted-foreground to -muted

export default AudioPlayer;
