import LoadingState from "@/components/states/LoadingState";
import useAuth from "@/features/user/auth/useAuth";
import Metric from "@/components/ui/Metric";
import useMetrics from "@/features/swipe/hooks/useMetrics";
import { formatCount, formatPercentage } from "@/lib/utils";
import { usePlaylists } from "@/features/playlist/hooks/usePlaylists";
import Button from "@/components/ui/Button";
import SpotifyIcon from "@/assets/spotify.svg?react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Divider from "@/components/ui/Divider";

const LandingPage = () => {
  const { user, isLoading, redirectToLogin } = useAuth();
  const { data: metrics } = useMetrics();
  const { data: playlists } = usePlaylists();

  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl self-center">
      <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tighter font-bold text-center">
        <span className="block">Your playlist is bloated.</span>
        <span className="block text-muted-foreground">
          <span className="text-primary">Swipe</span> the dead weight away.
        </span>
      </h1>

      <h3 className="text-center text-base sm:text-lg tracking-tight">
        <span className="block font-medium">
          Tinder for your playlists. Swipe right to keep, left to cut.
        </span>
        <span className="block">Clean up years of saved songs in minutes.</span>
      </h3>

      <Button
        className="self-center"
        size="lg"
        icon={<SpotifyIcon className="size-5" />}
        onClick={() => (user ? navigate("/playlists") : redirectToLogin(location.pathname))}
      >
        {user ? "View your playlists" : "Log in with Spotify — it's free"}
      </Button>

      <Card>{/* Card display here */}</Card>

      <div className="flex flex-col gap-3">
        <h3 className="text-center font-medium tracking-tight text-lg">
          Three steps toward a cleaner playlist
        </h3>
        {(() => {
          const steps = [
            {
              heading: "Pick a playlist",
              body: "Connect Spotify and choose any playlist — even the 2,000-song dumpster fire.",
            },
            {
              heading: "Swipe through it",
              body: "A 30-second preview plays for each track. Swipe right to keep, left to cut.",
            },
            {
              heading: "Confirm the purge",
              body: "Review the cuts, back them up if you want, and delete all in just one click.",
            },
          ];
          return (
            <div className="grid grid-cols-3 gap-3">
              {steps.map((s, i) => (
                <Card className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-center size-6 bg-card-foreground text-card rounded-full text-sm font-semibold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.heading}</p>
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>

      {metrics &&
        (() => {
          const metricsSummary = [
            { label: "Songs swiped", amount: formatCount(metrics.total_swipes) },
            { label: "Cut rate", amount: formatPercentage(metrics.cut_rate) },
            { label: "Songs cut", amount: formatCount(metrics.total_cuts) },
          ];
          return (
            <div className="grid grid-cols-3 gap-3">
              {metricsSummary.map((m) => (
                <Metric key={m.label} {...m} tone="muted" />
              ))}
            </div>
          );
        })()}

      <Divider />

      {playlists &&
        metrics &&
        (() => {
          const mostTracksPlaylist = playlists.reduce((prev, curr) =>
            curr.tracks.total > prev.tracks.total ? curr : prev
          );
          const estimatedSkips = Math.round(mostTracksPlaylist.tracks.total * metrics.cut_rate);
          return (
            <p className="text-muted-foreground text-center">
              Your "{mostTracksPlaylist.name}" playlist has {mostTracksPlaylist.tracks.total}{" "}
              tracks. You could cut maybe {estimatedSkips}.
            </p>
          );
        })()}
    </div>
  );
};

export default LandingPage;
