import Image from "@/components/ui/Image";
import { cn, extractImageUrl } from "@/lib/utils";
import type { CurrentUser } from "@/types/spotify";
import { type ComponentProps } from "react";

type AvatarProps = ComponentProps<"button"> & {
  user: CurrentUser;
};

const Avatar = ({ user, className, ...props }: AvatarProps) => {
  const profilePictureUrl = extractImageUrl(user.images, "sm");

  return (
    <button
      className={cn(
        "inline-flex items-center rounded-full overflow-hidden size-8 shrink-0 hover:scale-110 active:scale-100 transition-transform cursor-pointer",
        className
      )}
      {...props}
    >
      <Image
        src={profilePictureUrl}
        className="size-full object-cover aspect-square"
        alt="Profile picture"
      />
    </button>
  );
};

export default Avatar;
