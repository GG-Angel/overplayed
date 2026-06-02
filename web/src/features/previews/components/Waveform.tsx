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
  waveformRef?: Ref<WaveformHandler>;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
};

const Waveform = ({ url, waveformRef, className, onPlay, onPause }: WaveformProps) => {
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // expose API to parent via ref
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

  // create wavesurfer instance
  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "gray",
      progressColor: "#1ed760", // sp-green
      height: "auto",
      barWidth: 1,
      barGap: 2,
      barRadius: 1,
      normalize: true,
      autoplay: true,
      dragToSeek: true,
    });

    setWavesurfer(wavesurfer);

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  // load new tracks
  useEffect(() => {
    if (!wavesurfer) return;
    if (!url) {
      if (wavesurfer.getDecodedData() !== null) {
        wavesurfer.empty();
        wavesurfer.pause();
      }
      return;
    }
    wavesurfer.load(url);
  }, [url, wavesurfer]);

  // handle player events
  useEffect(() => {
    if (!wavesurfer) return;

    const subscriptions = [
      wavesurfer.on("ready", () => {
        wavesurfer.play(); // autoplay when new track is loaded
      }),
      wavesurfer.on("finish", () => {
        wavesurfer.seekTo(0);
        wavesurfer.play(); // loop when end is reached
      }),
      wavesurfer.on("play", () => onPlay?.()),
      wavesurfer.on("pause", () => onPause?.()),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer, onPause, onPlay]);

  return <div ref={containerRef} className={className} />;
};

export default Waveform;
