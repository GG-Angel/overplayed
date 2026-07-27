import { Volume2, VolumeOff } from "lucide-react";
import Card from "@/components/ui/Card";

type VolumeControlProps = {
  volume: number;
  onVolumeChange: (volume: number) => void;
};

const VolumeControl = ({ volume, onVolumeChange }: VolumeControlProps) => {
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
      <div className="text-muted border-faded border-2 rounded-full p-2.5">
        <VolumeIcon className="size-4" />
      </div>
    </div>
  );
};

export default VolumeControl;
