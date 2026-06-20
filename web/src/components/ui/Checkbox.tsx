import { Square, SquareCheckBig } from "lucide-react";

type CheckboxProps = {
  enabled: boolean;
  onEnabledChange: (() => void) | undefined;
};

const Checkbox = ({ enabled, onEnabledChange }: CheckboxProps) => {
  const Icon = enabled ? SquareCheckBig : Square;
  return (
    <button onClick={onEnabledChange} className="cursor-pointer text-primary">
      <Icon />
    </button>
  );
};

export default Checkbox;
