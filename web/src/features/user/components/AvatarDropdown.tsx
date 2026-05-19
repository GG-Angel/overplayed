import type { ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import { cn, openExternalUrl } from "@/lib/utils";
import { Link, LogOut, User } from "lucide-react";
import useAuth from "@/features/user/auth/useAuth";
import AvatarDropdownButton from "./AvatarDropdownButton";

type AvatarDropdownProps = ComponentProps<"div">;

const AvatarDropdown = ({ className, ...props }: AvatarDropdownProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div
      role="menu"
      className={cn(
        "flex flex-col divide-y-2 divide-border bg-card border-2 border-card-border rounded-lg overflow-hidden shadow-lg",
        className
      )}
      {...props}
    >
      <AvatarDropdownButton
        icon={<User className="size-4.5" />}
        onClick={() => openExternalUrl(user.external_urls.spotify)}
      >
        Hi, <span className="text-primary font-medium">{user.display_name}</span>
      </AvatarDropdownButton>
      <AvatarDropdownButton
        icon={<Link className="size-4.5" />}
        onClick={() => openExternalUrl(user.external_urls.spotify)}
      >
        Visit profile
      </AvatarDropdownButton>
      <AvatarDropdownButton
        icon={<LogOut className="size-4.5" />}
        className="text-destructive"
        onClick={handleLogout}
      >
        Log out
      </AvatarDropdownButton>
    </div>
  );
};

export default AvatarDropdown;
