import Card from "./ui/Card";
import Waveform, { type WaveformHandler } from "./Waveform";
import { useRef, useState } from "react";
import IconButton from "./ui/IconButton";
import { Pause, Play } from "lucide-react";

type AudioPlayerProps = {
  audio: HTMLAudioElement | undefined;
};

const AudioPlayer = ({ audio }: AudioPlayerProps) => {
  const waveformRef = useRef<WaveformHandler>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card size="sm" className="flex items-center gap-3">
      <IconButton
        size="xs"
        variant="green"
        icon={isPlaying ? Pause : Play}
        onClick={() => waveformRef.current?.playPause()}
      />
      <Waveform
        waveformRef={waveformRef}
        className="flex-1 self-stretch"
        audio={audio}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </Card>
  );
};

export default AudioPlayer;
