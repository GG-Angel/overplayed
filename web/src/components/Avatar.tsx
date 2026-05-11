import type { SpotifyCurrentUser } from "@/types/api";

type AvatarProps = {
  user: SpotifyCurrentUser;
};

const Avatar = ({ user }: AvatarProps) => {
  return (
    <button className="inline-flex rounded-full overflow-hidden size-8 shrink-0 bg-sp-gray hover:scale-110 transition-transform">
      <img
        src={user.images[0]?.url}
        className="size-full object-cover"
        alt={`${user.display_name}'s profile picture`}
      />
    </button>
  );
};

export default Avatar;
