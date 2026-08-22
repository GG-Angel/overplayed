import { Square, SquareCheckBig } from "lucide-react";

type CheckboxProps = {
  enabled: boolean;
  onEnabledChange?: () => void;
};

const Checkbox = ({ enabled, onEnabledChange }: CheckboxProps) => {
  const Icon = enabled ? SquareCheckBig : Square;
  return (
    <button type="button" onClick={onEnabledChange} className="cursor-pointer text-primary">
      <Icon />
    </button>
  );
};

export default Checkbox;
