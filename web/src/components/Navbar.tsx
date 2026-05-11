import { SkipForward } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Avatar from "@/components/Avatar";
import Button from "./ui/Button";
import useAuth from "@/features/auth/useAuth";

const Navbar = () => {
  const { user, login } = useAuth();
  const location = useLocation();

  return (
    <div className="flex justify-between items-center py-2">
      <Link to="/" className="inline-flex items-center gap-1.5 select-none">
        <SkipForward className="text-sp-green" />
        <span className="text-lg font-semibold hidden sm:block">Overplayed</span>
      </Link>

      {user ? (
        <Avatar user={user} />
      ) : (
        <Button variant="outline" onClick={() => login(location.pathname)}>
          Log in
        </Button>
      )}
    </div>
  );
};

export default Navbar;
