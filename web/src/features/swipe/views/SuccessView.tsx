import type { Playlist } from "@/lib/types";

type SuccessViewProps = {
  newPlaylist: Playlist | null;
};

const SuccessView = ({ newPlaylist }: SuccessViewProps) => {
  return <div>SuccessView {newPlaylist?.id ?? "nah twin"}</div>;
};

export default SuccessView;
