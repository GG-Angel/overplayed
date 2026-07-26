import Logo from "../ui/Logo";
import UserMenu from "@/features/user/components/UserMenu";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center py-2 gap-4">
      <Logo />
      <UserMenu />
    </nav>
  );
};

export default Navbar;
