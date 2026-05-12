import { SkipForward } from "lucide-react";
import { Link } from "react-router-dom";
import AvatarControl from "./AvatarControl";

const Logo = () => (
  <Link to="/" className="inline-flex items-center gap-1.5 select-none">
    <SkipForward className="text-primary" />
    <span className="text-lg font-semibold hidden sm:block">Overplayed</span>
  </Link>
);

const Navbar = () => {
  return (
    <div className="flex justify-between items-center py-2">
      <Logo />
      <AvatarControl />
    </div>
  );
};

export default Navbar;
