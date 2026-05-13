import type { Track } from "@/lib/types";
import Card from "./ui/Card";
import { useTrackPreview } from "@/hooks/previews";
import Waveform, { type WaveformHandler } from "./Waveform";
import { useRef, useState } from "react";
import IconButton from "./ui/IconButton";
import { Pause, Play } from "lucide-react";

type TrackPlayerProps = {
  track: Track;
};

const TrackPlayer = ({ track }: TrackPlayerProps) => {
  const { data } = useTrackPreview(track.external_ids.isrc);
  const waveformRef = useRef<WaveformHandler>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const previewUrl = data?.preview_url;

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
        audioUrl={previewUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </Card>
  );
};

export default TrackPlayer;
