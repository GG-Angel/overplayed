import { useUserStats } from "@/api/queries";
import LoadingState from "@/components/states/LoadingState";
import Page from "@/components/layout/Page";
import Image from "@/components/ui/Image";
import CounterCard from "@/components/ui/cards/CounterCard";
import { extractImageUrl, formatCount, formatPercentage } from "@/lib/utils";
import Card from "@/components/ui/cards/Card";
import { useProtectedContext } from "@/features/session/auth/ProtectedContext";
import ErrorState from "@/components/states/ErrorState";

const StatsPage = () => {
  const { user } = useProtectedContext();
  const { data: metrics, isSuccess, isLoading } = useUserStats();

  if (isLoading) return <LoadingState message="Loading statistics..." />;
  if (!isSuccess) return <ErrorState message="Failed to Load Stats" />;

  return (
    <Page width="4xl" className="py-2">
      <h1 className="text-center">Your Statistics</h1>
      <Card tone="muted" className="flex flex-col xs:flex-row xs:items-center gap-3">
        <Image
          src={extractImageUrl(user.images, "lg")}
          className="aspect-square object-cover rounded-full size-16"
          alt="Profile picture"
        />
        <div className="truncate *:truncate">
          <h2>{user.display_name ?? "Unknown"}</h2>
          <p className="text-muted text-sm">{user.email}</p>
        </div>
      </Card>
      <div className="flex flex-col gap-3">
        <CounterCard label="Total Swipes" amount={formatCount(metrics.num_swipes)} />
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <CounterCard
            label="Total Dislikes"
            tone="negative"
            amount={formatCount(metrics.num_cuts)}
          />
          <CounterCard label="Total Likes" tone="positive" amount={formatCount(metrics.num_kept)} />
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <CounterCard label="Cut Rate" tone="muted" amount={formatPercentage(metrics.cut_rate)} />
          <CounterCard
            label="Playlists Cleaned"
            tone="muted"
            amount={formatCount(metrics.num_modified)}
          />
        </div>
      </div>
    </Page>
  );
};

export default StatsPage;
