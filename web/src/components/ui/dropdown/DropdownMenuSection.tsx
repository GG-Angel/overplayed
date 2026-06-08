type DropdownMenuSectionProps = {
  label: string;
};

const DropdownMenuSection = ({ label }: DropdownMenuSectionProps) => {
  return <p className="mx-3 my-1.5 text-xs font-semibold text-muted">{label}</p>;
};

export default DropdownMenuSection;
