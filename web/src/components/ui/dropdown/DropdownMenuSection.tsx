// TODO: complete

type DropdownMenuSectionProps = {
  label: string;
};

const DropdownMenuSection = ({ label }: DropdownMenuSectionProps) => {
  return <p className="mx-3 my-2 text-xs font-semibold text-muted-foreground">{label}</p>;
};

export default DropdownMenuSection;
