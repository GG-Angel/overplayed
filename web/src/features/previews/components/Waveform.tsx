import WaveSurfer from "wavesurfer.js";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type WaveformHandler = {
  play: () => void;
  pause: () => void;
  playPause: () => Promise<void> | undefined;
  isPlaying: () => boolean;
};

const FALLBACK_HEIGHT = 40;

/**
 * `destroy()` aborts an in-flight `load()`, and `play()` rejects when the media
 * is torn down mid-playback. Both happen on unmount, so an abort here is
 * expected teardown rather than a failure worth reporting.
 */
const ignoreAbort = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") return;
  console.error("Waveform playback failed:", error);
};

type WaveformProps = {
  url: string | null | undefined;
  waveformRef: Ref<WaveformHandler>;
  volume?: number;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onReady?: () => void;
};

const Waveform = ({
  url,
  waveformRef,
  volume = 1,
  className,
  onPlay,
  onPause,
  onReady,
}: WaveformProps) => {
  const ws = useRef<WaveSurfer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onPlay, onPause, onReady });
  const volumeRef = useRef(volume);

  useEffect(() => {
    callbacks.current = { onPlay, onPause, onReady };
  }, [onPlay, onPause, onReady]);

  useEffect(() => {
    if (!containerRef.current) return;

    ws.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "gray",
      progressColor: "#1ed760",
      height: containerRef.current.clientHeight || FALLBACK_HEIGHT,
      barWidth: 1,
      barGap: 2,
      barRadius: 1,
      normalize: true,
      dragToSeek: true,
    });

    ws.current.setVolume(volumeRef.current);

    const unsubs = [
      ws.current.on("ready", () => {
        ws.current?.setVolume(volumeRef.current);
        ws.current?.play().catch(ignoreAbort);
        callbacks.current.onReady?.();
      }),
      ws.current.on("finish", () => {
        ws.current?.seekTo(0);
        ws.current?.play().catch(ignoreAbort);
      }),
      ws.current.on("play", () => callbacks.current.onPlay?.()),
      ws.current.on("pause", () => callbacks.current.onPause?.()),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
      ws.current?.destroy();
    };
  }, []);

  useEffect(() => {
    volumeRef.current = volume;
    ws.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (!ws.current) return;

    if (!url) {
      ws.current.pause();
      return;
    }
    ws.current.load(url).catch(ignoreAbort);
  }, [url]);

  useImperativeHandle(
    waveformRef,
    () => ({
      play: () => ws.current?.play().catch(ignoreAbort),
      pause: () => ws.current?.pause(),
      playPause: () => ws.current?.playPause(),
      isPlaying: () => ws.current?.isPlaying() ?? false,
    }),
    []
  );

  return <div ref={containerRef} className={className} />;
};

export default Waveform;
