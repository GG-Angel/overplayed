import WaveSurfer from "wavesurfer.js";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

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

const WAVESURFER_OPTIONS = {
  waveColor: "gray",
  progressColor: "#1ed760",
  height: "auto",
  barWidth: 1,
  barGap: 2,
  barRadius: 1,
  normalize: true,
  dragToSeek: true,
} as const;

const Waveform = ({ url, waveformRef, className, onPlay, onPause }: WaveformProps) => {
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({ ...WAVESURFER_OPTIONS, container: containerRef.current });
    setWavesurfer(ws);
    return () => ws.destroy();
  }, []);

  useEffect(() => {
    if (!wavesurfer) return;
    if (!url) {
      wavesurfer.pause();
      return;
    }
    wavesurfer.load(url);
  }, [wavesurfer, url]);

  useEffect(() => {
    if (!wavesurfer) return;
    const unsubs = [
      wavesurfer.on("ready", () => wavesurfer.play()),
      wavesurfer.on("finish", () => {
        wavesurfer.seekTo(0);
        wavesurfer.play();
      }),
      wavesurfer.on("play", () => onPlay?.()),
      wavesurfer.on("pause", () => onPause?.()),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [wavesurfer, onPlay, onPause]);

  useImperativeHandle(
    waveformRef,
    () => ({
      play: () => wavesurfer?.play(),
      pause: () => wavesurfer?.pause(),
      playPause: () => wavesurfer?.playPause(),
      isPlaying: () => wavesurfer?.isPlaying() ?? false,
    }),
    [wavesurfer]
  );

  return <div ref={containerRef} className={className} />;
};

export default Waveform;
