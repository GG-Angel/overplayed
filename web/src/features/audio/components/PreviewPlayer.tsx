import { lazy, useCallback, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import WaveformSkeleton from "./WaveformSkeleton";
import VolumeControl from "./VolumeControl";
import type { WaveformHandler } from "./Waveform";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import { PREVIEW_SHORTCUTS } from "@/lib/shortcuts";
import useDebouncedStorage from "@/hooks/useDebouncedStorage";
import { loadFromStorage, storageKeys } from "@/lib/storage";
import type { TrackPreview } from "@/types/spotify";

const Waveform = lazy(() => import("./Waveform"));

type PreviewPlayerProps = {
  preview: TrackPreview | null | undefined;
  isLoading: boolean;
  isError: boolean;
  className?: string;
  shortcutsEnabled?: boolean;
};

const DEFAULT_VOLUME = 0.3;

const AudioPlayer = ({
  preview,
  isLoading,
  isError,
  className,
  shortcutsEnabled = true,
}: PreviewPlayerProps) => {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() =>
    loadFromStorage(localStorage, storageKeys.volume, DEFAULT_VOLUME)
  );
  const [muteCount, setMuteCount] = useState(0);
  const waveformRef = useRef<WaveformHandler>(null);
  const showWaveform = isReady && !isLoading && !isError && preview?.url;

  // persist volume settings
  useDebouncedStorage(localStorage, storageKeys.volume, volume);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => setIsPlaying(false), []);

  const handlePlayPause = useCallback(() => {
    const waveform = waveformRef.current;
    if (!waveform) return;

    setIsPlaying(!waveform.isPlaying());
    waveform.playPause()?.catch(() => setIsPlaying(false));
  }, []);

  const handleVolumeToggle = useCallback(() => {
    setVolume((prevVolume) => (prevVolume > 0 ? 0 : DEFAULT_VOLUME));
  }, []);

  // handle spacebar keydown to play/pause + mute/unmute the audio
  useKeyboardShortcuts(
    PREVIEW_SHORTCUTS,
    {
      playPause: handlePlayPause,
      mute: useCallback(() => {
        handleVolumeToggle();
        setMuteCount((prev) => prev + 1); // flashes volume button
      }, [handleVolumeToggle]),
      skipForward: useCallback(() => waveformRef.current?.skipForward(), []),
      skipBackward: useCallback(() => waveformRef.current?.skipBackward(), []),
    },
    shortcutsEnabled
  );

  return (
    <Card padding="sm" className={cn("flex items-center gap-3 overflow-visible py-2", className)}>
      <IconButton
        size="xs"
        variant="green"
        icon={isPlaying && preview?.url ? Pause : Play}
        disabled={!isPlaying && !preview?.url}
        onClick={handlePlayPause}
      />
      <div className="relative flex-1 self-stretch">
        <Waveform
          url={preview?.url}
          waveformRef={waveformRef}
          volume={volume}
          onPlay={handlePlay}
          onPause={handlePause}
          onReady={() => setIsReady(true)}
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
      <VolumeControl
        volume={volume}
        onVolumeChange={setVolume}
        onMuteToggle={handleVolumeToggle}
        muteCount={muteCount}
      />
    </Card>
  );
};

export default AudioPlayer;
