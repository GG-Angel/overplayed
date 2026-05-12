import { SkipForward } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Avatar from "@/components/Avatar";
import Button from "./ui/Button";
import { useAuth } from "@/hooks/auth";

const Logo = () => (
  <Link to="/" className="inline-flex items-center gap-1.5 select-none">
    <SkipForward className="text-sp-green" />
    <span className="text-lg font-semibold hidden sm:block">Overplayed</span>
  </Link>
);

const AuthControl = () => {
  const { user, redirectToLogin } = useAuth();
  const location = useLocation();

  if (user) return <Avatar user={user} />;

  return (
    <Button variant="outline" onClick={() => redirectToLogin(location.pathname)}>
      Log in
    </Button>
  );
};

const Navbar = () => {
  return (
    <div className="flex justify-between items-center py-2">
      <Logo />
      <AuthControl />
    </div>
  );
};

export default Navbar;
