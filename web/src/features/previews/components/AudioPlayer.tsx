import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Waveform, { type WaveformHandler } from "./Waveform";
import WaveformSkeleton from "./WaveformSkeleton";

type AudioPlayerProps = {
  audio: HTMLAudioElement | undefined;
  isError?: boolean;
  errorMessage?: string;
  className?: string;
};

const AudioPlayer = ({
  audio,
  className,
  isError,
  errorMessage = "no audio :(",
}: AudioPlayerProps) => {
  const waveformRef = useRef<WaveformHandler>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card size="sm" className={cn("flex items-center gap-3", className)}>
      <IconButton
        size="xs"
        variant="green"
        icon={!isError && isPlaying ? Pause : Play}
        disabled={isError}
        onClick={() => waveformRef.current?.playPause()}
      />
      <div className="relative flex-1 self-stretch">
        <Waveform
          waveformRef={waveformRef}
          className={cn("absolute inset-0 min-w-1", isError && "invisible")}
          audio={audio}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {isError && <WaveformSkeleton className="absolute inset-0" message={errorMessage} />}
      </div>
    </Card>
  );
};

export default AudioPlayer;
