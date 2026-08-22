import Button from "@/components/ui/Button";
import useAuth from "../auth/useAuth";
import Avatar from "./Avatar";
import DropdownAccessStatusItem from "./AccessStatus";
import { Spinner } from "@/components/ui/Spinner";
import Dropdown from "@/components/ui/dropdown/Dropdown";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import DropdownMenuItem from "@/components/ui/dropdown/DropdownMenuItem";
import { useNavigate } from "react-router-dom";
import DropdownMenuDivider from "@/components/ui/dropdown/DropdownMenuDivider";
import DropdownMenuButton from "@/components/ui/dropdown/DropdownMenuButton";
import { openExternalUrl } from "@/lib/utils";
import { ChartLine, ExternalLink, LogOut, User } from "lucide-react";
import { useCallback } from "react";

const UserMenu = () => {
  const { user, isLoading, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    navigate("/");
    logout();
  }, [logout, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center size-8">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button variant="secondary" onClick={login}>
        Log in
      </Button>
    );
  }

  return (
    <Dropdown
      trigger={({ toggle }) => <Avatar user={user} onClick={toggle} />}
      align="right"
      className="h-8"
    >
      <DropdownMenu className="w-64">
        <DropdownMenuItem className="flex-col items-start gap-0.5 [&>span]:w-full [&>span]:truncate">
          <span className="font-medium">{user.display_name}</span>
          <span className="text-xs text-muted">{user.email}</span>
        </DropdownMenuItem>
        <DropdownAccessStatusItem />
        <DropdownMenuDivider />
        <DropdownMenuButton onClick={() => openExternalUrl(user.external_urls.spotify)}>
          <User className="size-4.5" />
          Profile
          <ExternalLink className="size-4 ml-auto opacity-50" />
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

export default UserMenu;
