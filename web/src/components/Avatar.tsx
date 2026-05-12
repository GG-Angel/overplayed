import type { CurrentUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { type ComponentProps } from "react";

type AvatarProps = ComponentProps<"button"> & {
  user: CurrentUser;
};

const Avatar = ({ user, className, ...props }: AvatarProps) => {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-full overflow-hidden size-8 shrink-0 hover:scale-110 transition-transform hover:cursor-pointer",
        className
      )}
      {...props}
    >
      <img
        src={user.images[0]?.url}
        className="size-full object-cover"
        alt={`${user.display_name}'s profile picture`}
      />
    </button>
  );
};

export default Avatar;
