import AccessPill from "@/features/session/components/AccessPill";
import UserMenu from "@/features/session/components/UserMenu";
import Logo from "../ui/Logo";

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
