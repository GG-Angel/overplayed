import LoadingState from "@/components/states/LoadingState";
import Card from "@/components/ui/Card";
import Metric from "@/components/ui/Metric";
import { useUserSwipeMetrics } from "@/features/metrics/api/get-swipe-metrics";
import useAuth from "@/features/user/auth/useAuth";
import { extractImageUrl, formatCount, formatPercentage } from "@/lib/utils";

const StatisticsPage = () => {
  const { user } = useAuth();
  const { data: metrics } = useUserSwipeMetrics();

  if (!user || !metrics) {
    return <LoadingState message="Loading statistics..." />;
  }

  return (
    <main className="flex flex-col gap-6 py-2 w-full max-w-4xl self-center">
      <h1 className="text-center">Your Statistics</h1>
      <Card tone="muted" className="flex items-center gap-3">
        <img
          src={extractImageUrl(user?.images ?? [], "lg")}
          className="shrink-0 aspect-square object-cover rounded-full size-16"
        />
        <div className="truncate *:truncate">
          <h2>{user.display_name ?? "Unknown"}</h2>
          <p className="text-muted text-sm">{user.email}</p>
        </div>
      </Card>
      <div className="flex flex-col gap-3">
        <Metric label="Total Swipes" amount={formatCount(metrics.num_swipes)} />
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <Metric label="Total Dislikes" tone="negative" amount={formatCount(metrics.num_cuts)} />
          <Metric label="Total Likes" tone="positive" amount={formatCount(metrics.num_kept)} />
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <Metric label="Cut Rate" tone="muted" amount={formatPercentage(metrics.cut_rate)} />
          <Metric
            label="Playlists Cleaned"
            tone="muted"
            amount={formatCount(metrics.num_modified)}
          />
        </div>
      </div>
    </main>
  );
};

export default StatisticsPage;
