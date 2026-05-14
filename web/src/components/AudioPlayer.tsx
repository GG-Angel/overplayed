import Card from "./ui/Card";
import Waveform, { WaveformSkeleton, type WaveformHandler } from "./Waveform";
import { useRef, useState } from "react";
import IconButton from "./ui/IconButton";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type AudioPlayerProps = {
  audio: HTMLAudioElement | undefined;
  isError?: boolean;
};

const AudioPlayer = ({ audio, isError }: AudioPlayerProps) => {
  const waveformRef = useRef<WaveformHandler>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card size="sm" className="flex items-center gap-3">
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
          className={cn("absolute inset-0", isError && "invisible")}
          audio={audio}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {isError && <WaveformSkeleton className="absolute inset-0" message="no preview :(" />}
      </div>
    </Card>
  );
};

export default AudioPlayer;
