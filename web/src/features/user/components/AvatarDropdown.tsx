import type { ComponentProps, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn, openExternalUrl } from "@/lib/utils";
import { Link, LogOut, User } from "lucide-react";
import useAuth from "@/features/user/auth/useAuth";

type AvatarDropdownProps = ComponentProps<"div">;

type MenuItemProps = ComponentProps<"button"> & {
  icon: ReactNode;
};

const AvatarDropdownButton = ({ icon, children, className, ...props }: MenuItemProps) => (
  <button
    role="menuitem"
    className={cn(
      "flex gap-1.5 items-center py-2 px-4 text-left hover:cursor-pointer hover:bg-card-border/50",
      className
    )}
    {...props}
  >
    {icon}
    {children}
  </button>
);

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
