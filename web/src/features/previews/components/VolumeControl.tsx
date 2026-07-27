import { Volume2, VolumeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";

type VolumeControlProps = {
  volume: number;
  onVolumeChange: (volume: number) => void;
};

const VolumeControl = ({ volume, onVolumeChange }: VolumeControlProps) => {
  const VolumeIcon = volume === 0 ? VolumeOff : Volume2;

  return (
    <div className="group relative hidden md:flex justify-center items-center">
      <Card tone="muted" radius="lg" className="absolute bottom-full mb-5">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="Volume"
          className={cn(
            "h-20 w-1 cursor-pointer appearance-none bg-transparent [direction:rtl] [writing-mode:vertical-lr]",
            "[&::-webkit-slider-runnable-track]:w-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-faded",
            "[&::-webkit-slider-thumb]:-ml-1 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
            "[&::-moz-range-track]:w-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-faded",
            "[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary"
          )}
        />
      </Card>
      <IconButton
        className="active:opacity-100 cursor-default"
        size="xs"
        variant="neutral"
        icon={VolumeIcon}
      />
    </div>
    // <div className={cn("group relative hidden items-center md:flex", className)}>
    //   <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 pb-3 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
    //     <Card radius="lg" padding="sm" className="items-center justify-center">
    //       <input
    //         type="range"
    //         min={0}
    //         max={1}
    //         step={0.01}
    //         value={volume}
    //         onChange={(e) => onVolumeChange(Number(e.target.value))}
    //         aria-label="Volume"
    //         className={cn(
    //           "h-20 w-1 cursor-pointer appearance-none bg-transparent [direction:rtl] [writing-mode:vertical-lr]",
    //           "[&::-webkit-slider-runnable-track]:w-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-faded",
    //           "[&::-webkit-slider-thumb]:-ml-1 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
    //           "[&::-moz-range-track]:w-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-faded",
    //           "[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary"
    //         )}
    //       />
    //     </Card>
    //   </div>
    //   <IconButton
    //     className="active:opacity-100 cursor-default"
    //     size="xs"
    //     variant="neutral"
    //     icon={VolumeIcon}
    //   />
    // </div>
  );
};

export default VolumeControl;
