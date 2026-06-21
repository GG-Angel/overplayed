import LoadingState from "@/components/states/LoadingState";
import Card from "@/components/ui/Card";
import Metric from "@/components/ui/Metric";
import useAuth from "@/features/user/auth/useAuth";
import { extractImageUrl } from "@/lib/utils";

const StatisticsPage = () => {
  const { user } = useAuth();
  const profilePictureUrl = extractImageUrl(user?.images ?? [], "lg");

  if (!user) {
    return <LoadingState message="Loading statistics..." />;
  }

  return (
    <main className="flex flex-col gap-6 py-2 w-full max-w-4xl self-center">
      <h1 className="text-center">Your Statistics</h1>
      <Card tone="muted" className="flex items-center gap-3">
        <img
          src={profilePictureUrl}
          className="shrink-0 aspect-square object-cover rounded-full size-16"
        />
        <div className="text-left grow truncate *:truncate">
          <h2>{user.display_name ?? user.email}</h2>
          <p className="text-muted text-sm">Joined on uhhh</p>
        </div>
      </Card>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <Metric label="Total Swipes" amount={0} />
        <Metric label="Total Swipes" amount={0} />
        <Metric label="Total Swipes" amount={0} />
        <Metric label="Total Swipes" amount={0} />
      </div>
    </main>
  );
};

export default StatisticsPage;
