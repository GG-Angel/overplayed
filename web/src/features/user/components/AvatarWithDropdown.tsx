import Button from "@/components/ui/Button";
import useAuth from "../auth/useAuth";
import Avatar from "./Avatar";
import { Spinner } from "@/components/ui/Spinner";
import Dropdown from "@/components/ui/dropdown/Dropdown";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import DropdownMenuItem from "@/components/ui/dropdown/DropdownMenuItem";
import { useLocation, useNavigate } from "react-router-dom";
import DropdownMenuDivider from "@/components/ui/dropdown/DropdownMenuDivider";
import DropdownMenuButton from "@/components/ui/dropdown/DropdownMenuButton";
import { openExternalUrl } from "@/lib/utils";
import { ChartLine, ExternalLink, LogOut, User } from "lucide-react";

const AvatarWithDropdown = () => {
  const { user, isLoading, redirectToLogin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  if (!user)
    return (
      <Button variant="secondary" onClick={() => redirectToLogin(location.pathname)}>
        Log in
      </Button>
    );

  return (
    <Dropdown trigger={({ toggle }) => <Avatar user={user} onClick={toggle} />} align="right">
      <DropdownMenu className="w-64">
        <DropdownMenuItem className="flex-col items-start gap-0.5 [&>span]:w-full [&>span]:truncate">
          <span className="font-medium">{user.display_name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuDivider />
        <DropdownMenuButton onClick={() => openExternalUrl(user.external_urls.spotify)}>
          <User className="size-4.5" />
          Profile
          <ExternalLink className="size-4 ml-auto opacity-60" />
        </DropdownMenuButton>
        <DropdownMenuButton onClick={() => navigate("/statistics")}>
          <ChartLine className="size-4.5" />
          Statistics
        </DropdownMenuButton>
        <DropdownMenuDivider />
        <DropdownMenuButton onClick={handleLogout} className="text-destructive">
          <LogOut className="size-4.5" />
          Log out
        </DropdownMenuButton>
      </DropdownMenu>
    </Dropdown>
  );
};

export default AvatarWithDropdown;
