import { Square, SquareCheck } from "lucide-react";

type CheckboxProps = {
  enabled: boolean;
  onEnabledChange: () => void;
};

const Checkbox = ({ enabled, onEnabledChange }: CheckboxProps) => {
  const Icon = enabled ? SquareCheck : Square;
  return (
    <button onClick={onEnabledChange} className="hover:cursor-pointer text-primary">
      <Icon />
    </button>
  );
};

export default Checkbox;
