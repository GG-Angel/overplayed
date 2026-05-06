import { paths } from "@/config/paths";
import { SkipForward } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/button";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate(paths.home.getHref());
  };

  return (
    <div className="flex justify-between items-center">
      <button
        className="inline-flex items-center gap-1.5 select-none cursor-pointer"
        onClick={handleLogoClick}
      >
        <SkipForward className="text-sp-green" />
        <span className="text-lg font-semibold hidden sm:block">Overplayed</span>
      </button>
      <Button variant="outline">Log in</Button>
    </div>
  );
};

export default Navbar;
