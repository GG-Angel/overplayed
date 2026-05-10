import { SkipForward } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import { useUserContext } from "@/context/UserContext";
import Avatar from "./Avatar";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, login } = useUserContext();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <div className="flex justify-between items-center py-2">
      <button className="inline-flex items-center gap-1.5 select-none" onClick={handleLogoClick}>
        <SkipForward className="text-sp-green" />
        <span className="text-lg font-semibold hidden sm:block">Overplayed</span>
      </button>

      {user ? (
        <Avatar user={user} />
      ) : (
        <Button variant="outline" onClick={login}>
          Log in
        </Button>
      )}
    </div>
  );
};

export default Navbar;
