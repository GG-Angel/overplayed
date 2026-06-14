import useAuth from "@/features/user/auth/useAuth";
import Metric from "@/components/ui/Metric";
import { formatCount, formatPercentage } from "@/lib/utils";
import Button from "@/components/ui/Button";
import SpotifyIcon from "@/assets/spotify.svg?react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Divider from "@/components/ui/Divider";
import SwipeButtons from "@/features/swipe/components/SwipeButtons";
import SwipeCardStack from "@/features/swipe/components/SwipeCardStack";
import { useGlobalSwipeMetrics } from "@/features/metrics/api/get-swipe-metrics";
import useSwipeCarousel from "@/features/swipe/hooks/useSwipeCarousel";
import carouselTracks from "@/assets/carousel-tracks.json";
import z from "zod";
import { trackSchema } from "@/lib/types";
import { useUserPlaylists } from "@/features/playlist/api/get-playlists";

const swipeSteps = [
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

const LandingPage = () => {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: metrics } = useGlobalSwipeMetrics();
  const { data: playlists } = useUserPlaylists({ enabled: !!auth.user });

  const carousel = useSwipeCarousel(z.array(trackSchema).parse(carouselTracks));

  return (
    <main className="flex flex-col gap-8 w-full max-w-3xl self-center py-8">
      <h1 className="text-center">
        <span className="block">Your playlist is bloated. </span>
        <span className="block text-muted">
          <span className="text-primary">Swipe</span> the dead weight away.
        </span>
      </h1>

      <h2 className="text-center">
        <span className="xs:block">
          Tinder for your playlists. Swipe right to keep, left to cut.
        </span>{" "}
        <span className="xs:block">Clean up years of saved songs in minutes.</span>
      </h2>

      <Button
        className="self-center"
        size="lg"
        icon={<SpotifyIcon className="size-5" />}
        onClick={() =>
          auth.user ? navigate("/playlists") : auth.redirectToLogin(location.pathname)
        }
      >
        {auth.user ? "View your playlists" : "Log in with Spotify — it's free"}
      </Button>

      <Card
        className="flex flex-col items-center gap-6 pointer-events-none py-6"
        tone="muted"
        radius="lg"
        padding="lg"
      >
        <SwipeCardStack
          topCardRef={carousel.topCardRef}
          tracks={carousel.visibleTracks}
          onSwipeEnd={carousel.next}
        />
        <SwipeButtons />
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-center">Three steps toward a cleaner playlist</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {swipeSteps.map((step, index) => (
            <Card key={step.heading} className="flex flex-col gap-1.5 py-3">
              <div className="flex items-center justify-center size-6 bg-card-foreground text-card rounded-full text-sm font-semibold select-none">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-sm">{step.heading}</p>
                <p className="text-sm text-muted">{step.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {metrics && (
        <div className="flex flex-col gap-3">
          <h2 className="text-center">Global statistics</h2>
          {(() => {
            const metricsSummary = [
              { label: "Songs swiped", amount: formatCount(metrics.total_swipes) },
              { label: "Cut rate", amount: formatPercentage(metrics.cut_rate) },
              { label: "Songs cut", amount: formatCount(metrics.total_cuts) },
            ];
            return (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                {metricsSummary.map((m) => (
                  <Metric
                    key={m.label}
                    className="first:col-span-1 xs:first:col-span-2 sm:first:col-span-1"
                    {...m}
                    tone="muted"
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {playlists &&
        metrics &&
        (() => {
          const mostTracksPlaylist = playlists.reduce((prev, curr) =>
            curr.tracks.total > prev.tracks.total ? curr : prev
          );
          const estimatedSkips = Math.round(mostTracksPlaylist.tracks.total * metrics.cut_rate);
          return (
            <>
              <Divider />
              <p className="text-muted text-center wrap-break-word">
                Your playlist{" "}
                <Link
                  to={`/playlists/${mostTracksPlaylist.id}/swipe`}
                  className="text-accent underline"
                >
                  {mostTracksPlaylist.name}
                </Link>{" "}
                has {mostTracksPlaylist.tracks.total} tracks. You could cut maybe {estimatedSkips}.
              </p>
            </>
          );
        })()}
    </main>
  );
};

export default LandingPage;
