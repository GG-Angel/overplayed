import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import { Pause, Play } from "lucide-react";
import { useState } from "react";

type PreviewPlayerProps = {
  isrc: string;
};

const PreviewPlayer = ({ isrc }: PreviewPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const PlayButtonIcon = isPlaying ? Pause : Play;

  return (
    <Card size="sm">
      <IconButton icon={PlayButtonIcon} size="xs" onClick={() => setIsPlaying((prev) => !prev)} />
      <p>{isrc}</p>
    </Card>
  );
};

export default PreviewPlayer;
