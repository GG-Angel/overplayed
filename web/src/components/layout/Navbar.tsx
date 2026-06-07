import Logo from "../ui/Logo";
import AvatarWithDropdown from "@/features/user/components/AvatarWithDropdown";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center py-2 gap-4">
      <Logo />
      <AvatarWithDropdown />
    </div>
  );
};

export default Navbar;
