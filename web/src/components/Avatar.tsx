import type { CurrentUser } from "@/lib/types";
import type { ComponentProps } from "react";

type AvatarProps = ComponentProps<"button"> & {
  user: CurrentUser;
};

const Avatar = ({ user, ...props }: AvatarProps) => {
  return (
    <button
      className="inline-flex rounded-full overflow-hidden size-8 shrink-0 hover:scale-110 transition-transform"
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
