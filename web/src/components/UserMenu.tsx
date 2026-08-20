import type { ComponentProps } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChartLine, ExternalLink, Hourglass, LogOut, User } from "lucide-react";
import useAuth from "../app/auth";
import type { CurrentUser, QueueUserStatus } from "../types";
import { cn, extractImageUrl, openExternalUrl } from "../utils";
import Button from "./ui/Button";
import Image from "./ui/Image";
import { Spinner } from "./ui/Spinner";
import Dropdown, {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuDivider,
  DropdownMenuItem,
} from "./ui/Dropdown";
import { useAccessCountdown } from "./AccessPill";

type AvatarProps = ComponentProps<"button"> & { user: CurrentUser };

const Avatar = ({ user, className, ...props }: AvatarProps) => (
  <button
    className={cn(
      "inline-flex items-center rounded-full overflow-hidden size-8 shrink-0 hover:scale-110 active:scale-100 transition-transform cursor-pointer",
      className
    )}
    {...props}
  >
    <Image
      src={extractImageUrl(user.images, "sm")}
      className="size-full object-cover aspect-square"
      alt="Profile picture"
    />
  </button>
);

const describeAccess = (access: QueueUserStatus, label: string | null, isExpired: boolean) =>
  access.status === "active"
    ? isExpired
      ? "Access expired"
      : `Access · ${label} left`
    : `#${access.position_in_queue} in line`;

const AccessStatus = () => {
  const { access, isLoading, label, isLow, isExpired } = useAccessCountdown();
  if (isLoading || !access) return null;
  return (
    <DropdownMenuItem className="text-xs text-muted">
      <Hourglass className={cn("size-3.5 shrink-0", isLow && "text-destructive")} />
      <span className={cn("truncate", isLow && "text-destructive font-medium")}>
        {describeAccess(access, label, isExpired)}
      </span>
    </DropdownMenuItem>
  );
};

const UserMenu = () => {
  const { user, isLoading, redirectToLogin, logoutMutation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => {
    navigate("/");
    await logoutMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center size-8">
        <Spinner size="sm" />
      </div>
    );
  }
  if (!user) {
    return (
      <Button variant="secondary" onClick={() => redirectToLogin(location.pathname)}>
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
        <AccessStatus />
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
