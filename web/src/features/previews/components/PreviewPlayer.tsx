import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Waveform, { type WaveformHandler } from "./Waveform";
import WaveformSkeleton from "./WaveformSkeleton";

type PreviewPlayerProps = {
  url?: string | undefined;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

const PreviewPlayer = ({
  url,
  isLoading = true,
  isError = true,
  className = "",
}: PreviewPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef<WaveformHandler>(null);

  return (
    <Card size="sm" className={cn("flex items-center gap-3", className)}>
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
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className={cn("absolute inset-0 min-w-1", !url && "invisible")}
        />
        {!url && (
          <WaveformSkeleton
            className="absolute inset-0"
            message={isError ? "no preview :(" : isLoading ? "loading..." : ""}
          />
        )}
      </div>
    </Card>
  );
};

export default PreviewPlayer;
