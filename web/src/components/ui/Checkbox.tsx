import { Square, SquareCheckBig } from "lucide-react";

type CheckboxProps = {
  enabled: boolean;
};

const Checkbox = ({ enabled }: CheckboxProps) => {
  const CheckboxIcon = enabled ? SquareCheckBig : Square;
  return <CheckboxIcon className="shrink-0 text-primary" aria-hidden />;
};

export default Checkbox;
