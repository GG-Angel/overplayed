import Logo from "../ui/Logo";
import UserMenu from "@/features/user/components/UserMenu";
import AccessPill from "@/features/user/components/AccessPill";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center py-2 gap-4">
      <Logo />
      <div className="flex items-center gap-3">
        <AccessPill />
        <UserMenu />
      </div>
    </nav>
  );
};

export default Navbar;
