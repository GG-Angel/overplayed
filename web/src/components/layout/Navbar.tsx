import Logo from "../ui/Logo";
import UserMenu from "@/features/user/components/UserMenu";

const Navbar = () => {
  return (
    <div role="navigation" className="flex justify-between items-center py-2 gap-4">
      <Logo />
      <UserMenu />
    </div>
  );
};

export default Navbar;
