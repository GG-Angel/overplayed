import AvatarControl from "@/features/user/components/AvatarControl";
import Logo from "../ui/Logo";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center py-2 gap-4">
      <Logo />
      <AvatarControl />
    </div>
  );
};

export default Navbar;
