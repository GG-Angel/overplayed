import WaveSurfer from "wavesurfer.js";
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type Ref,
} from "react";

export type WaveformHandler = {
  play: () => void;
  pause: () => void;
  playPause: () => void;
  isPlaying: () => boolean;
};

type WaveformProps = ComponentProps<"div"> & {
  audio: HTMLAudioElement | undefined;
  waveformRef?: Ref<WaveformHandler>;
  onPlay?: () => void;
  onPause?: () => void;
};

const Waveform = ({ audio, waveformRef, onPlay, onPause, ...props }: WaveformProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);

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
      dragToSeek: true,
      normalize: true,
      autoplay: true,
    });

    setWavesurfer(wavesurfer);

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  // load new tracks
  useEffect(() => {
    if (!wavesurfer || !audio) return;
    wavesurfer.load(audio.src);
  }, [audio, wavesurfer]);

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

  return <div ref={containerRef} {...props} />;
};

export default Waveform;
