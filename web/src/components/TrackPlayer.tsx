import type { Track } from "@/lib/types";
import Card from "./ui/Card";
import { useTrackPreview } from "@/hooks/previews";
import WaveSurfer from "wavesurfer.js";
import { useEffect, useRef, useState } from "react";
import Button from "./ui/Button";

type WaveformProps = {
  audioUrl: string | undefined;
};

type TrackPlayerProps = {
  track: Track;
};

const Waveform = ({ audioUrl }: WaveformProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);

  // create wavesurfer instance
  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "gray",
      progressColor: "#1ed760", // sp-green
      height: 32,
      barWidth: 1,
      barGap: 2,
      barRadius: 1,
      dragToSeek: true,
      normalize: true,
    });

    setWavesurfer(wavesurfer);

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  // load new tracks
  useEffect(() => {
    if (!wavesurfer || !audioUrl) return;
    wavesurfer.load(audioUrl);
  }, [audioUrl, wavesurfer]);

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
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer]);

  return (
    <>
      <div ref={containerRef} />
      <Button
        onClick={() => {
          if (!wavesurfer) return;
          wavesurfer.playPause();
        }}
      >
        Click me
      </Button>
    </>
  );
};

const TrackPlayer = ({ track }: TrackPlayerProps) => {
  const { data } = useTrackPreview(track.external_ids.isrc);
  const previewUrl = data?.preview_url;

  return (
    <Card size="sm" className="flex flex-col">
      {track.name} {track.external_ids.isrc}
      <Waveform audioUrl={previewUrl} />
    </Card>
  );
};

export default TrackPlayer;
