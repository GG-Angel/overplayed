import { Volume2, VolumeOff } from "lucide-react";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";

type VolumeControlProps = {
  volume: number;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
};

const VolumeControl = ({ volume, onVolumeChange, onMuteToggle }: VolumeControlProps) => {
  const VolumeIcon = volume === 0 ? VolumeOff : Volume2;

  return (
    <div className="group relative hidden md:flex justify-center items-center">
      <Card tone="muted" radius="lg" className="absolute bottom-16 hidden group-hover:flex">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="Volume"
          className="[writing-mode:vertical-lr] [direction:rtl] min-h-36 h-36 cursor-grab active:cursor-grabbing accent-accent"
        />
      </Card>
      <div className="absolute size-16 bottom-0" />
      <IconButton
        icon={VolumeIcon}
        size="xs"
        variant="neutral"
        onClick={onMuteToggle}
        className="z-10"
      />
    </div>
  );
};

export default VolumeControl;
