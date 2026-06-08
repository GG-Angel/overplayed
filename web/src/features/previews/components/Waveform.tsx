import WaveSurfer from "wavesurfer.js";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type WaveformHandler = {
  play: () => void;
  pause: () => void;
  playPause: () => void;
  isPlaying: () => boolean;
};

type WaveformProps = {
  url: string | undefined;
  waveformRef: Ref<WaveformHandler>;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
};

const Waveform = ({ url, waveformRef, className, onPlay, onPause }: WaveformProps) => {
  const ws = useRef<WaveSurfer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onPlay, onPause });

  useEffect(() => {
    callbacks.current = { onPlay, onPause };
  }, [onPlay, onPause]);

  useEffect(() => {
    if (!containerRef.current) return;

    ws.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "gray",
      progressColor: "#1ed760",
      height: "auto",
      barWidth: 1,
      barGap: 2,
      barRadius: 1,
      normalize: true,
      dragToSeek: true,
    });

    const unsubs = [
      ws.current.on("ready", () => ws.current?.play()),
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
