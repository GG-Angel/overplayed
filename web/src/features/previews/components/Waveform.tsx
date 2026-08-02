import WaveSurfer from "wavesurfer.js";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type WaveformHandler = {
  play: () => void;
  pause: () => void;
  playPause: () => Promise<void> | undefined;
  isPlaying: () => boolean;
};

const FALLBACK_HEIGHT = 40;

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
        ws.current?.play();
        callbacks.current.onReady?.();
      }),
      ws.current.on("finish", () => {
        ws.current?.seekTo(0);
        ws.current?.play();
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
    ws.current.load(url);
  }, [url]);

  useImperativeHandle(
    waveformRef,
    () => ({
      play: () => ws.current?.play(),
      pause: () => ws.current?.pause(),
      playPause: () => ws.current?.playPause(),
      isPlaying: () => ws.current?.isPlaying() ?? false,
    }),
    []
  );

  return <div ref={containerRef} className={className} />;
};

export default Waveform;
