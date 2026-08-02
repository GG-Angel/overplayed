import useAuth from "@/features/user/auth/useAuth";
import Metric from "@/components/ui/Metric";
import { cn, fallbackImageUrl, formatCount, formatPercentage, openExternalUrl } from "@/lib/utils";
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
import { LIKED_SONGS_ID, trackSchema } from "@/lib/types";
import { useUserPlaylists } from "@/features/playlist/api/get-playlists";
import { useSwipeLeaderboard } from "@/features/metrics/api/get-swipe-leaderboad";
import { Key, Scissors } from "lucide-react";
import Image from "@/components/ui/Image";
import { useAccessContext } from "@/features/user/provider/AccessContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const carousel = useSwipeCarousel(z.array(trackSchema).parse(carouselTracks));
  const { data: metrics } = useGlobalSwipeMetrics();
  const { data: leaderboard } = useSwipeLeaderboard();
  const { data: playlists } = useUserPlaylists({ enabled: !!auth.user });
  const { hasRequestedAccess } = useAccessContext();

  return (
    <main className="flex flex-col gap-8 w-full max-w-3xl self-center py-8">
      <h1 className="text-center">
        <span className="block">Your playlist is bloated. </span>
        <span className="block text-muted">
          <span className="text-primary">Swipe</span> the dead weight away.
        </span>
      </h1>

      <h3 className="text-center">
        <span className="xs:block">
          Tinder for your playlists. Swipe right to keep, left to cut.
        </span>{" "}
        <span className="xs:block">Clean up years of saved songs in minutes.</span>
      </h3>

      <div className="flex flex-col items-center justify-center xs:flex-row gap-3 w-full max-w-xl self-center">
        {auth.user ? (
          <Button
            className="self-center"
            size="lg"
            icon={<SpotifyIcon className="size-5 shrink-0" />}
            onClick={() => navigate("/playlists")}
          >
            View your playlists
          </Button>
        ) : (
          <>
            <Button
              className={hasRequestedAccess ? "w-full" : "self-center"}
              icon={<Key className="size-5 shrink-0" />}
              size="lg"
              variant="primary"
              onClick={() => navigate("/request-access")}
            >
              Request Access
            </Button>
            <Button
              hidden={!hasRequestedAccess}
              className="w-full"
              size="lg"
              icon={<SpotifyIcon className="size-5 shrink-0" />}
              variant="secondary"
              onClick={() => auth.redirectToLogin(location.pathname)}
            >
              Log in with Spotify
            </Button>
          </>
        )}
      </div>

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
        <h3 className="text-center">Three steps toward a cleaner playlist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
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
          ].map((step, index) => (
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
          <h3 className="text-center">Global statistics</h3>
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

      {leaderboard && (
        <div className="flex flex-col overflow-auto">
          <h3 className="text-center">Top users</h3>

          {leaderboard.length > 0 ? (
            <>
              <p className="text-xs text-center text-muted">Based on tracks cut, last 30 days</p>
              <table className="text-xs xs:text-sm w-full border-separate border-spacing-x-0 border-spacing-y-1.5">
                <thead>
                  <tr className="[&_th]:py-1 [&_th]:px-4">
                    <th className="text-left">Rank</th>
                    <th className="text-left">User</th>
                    <th className="text-center">Swipes</th>
                    <th className="hidden xs:table-cell text-center">Cuts</th>
                    <th className="hidden sm:table-cell text-center">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 5).map(({ user, metrics }, index) => (
                    <tr
                      key={user.id}
                      className="group cursor-pointer [&_td]:group-hover:bg-card [&_td]:group-hover:border-card-border [&_td]:bg-card/40 [&_td]:border-card-border/40 [&_td]:py-1 [&_td]:px-4 [&_td]:border-y-2"
                      onClick={() => openExternalUrl(user.spotify_url)}
                    >
                      <td className={cn("rounded-l-lg border-l-2", index === 0 && "text-accent")}>
                        #{index + 1}
                      </td>
                      <td className="max-w-0 w-full">
                        <div className="flex items-center gap-2.5">
                          <Image
                            src={fallbackImageUrl(user.picture_url)}
                            className="size-8 aspect-square object-cover rounded-full"
                            alt={user.display_name ?? "Unknown user"}
                          />
                          <span className="font-medium hover:underline truncate min-w-0">
                            {user.display_name ?? "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="rounded-r-lg border-r-2 xs:rounded-r-none xs:border-r-0 text-center">
                        {formatCount(metrics.total_swipes)}
                      </td>
                      <td className="hidden xs:table-cell rounded-r-lg border-r-2 sm:rounded-r-none sm:border-r-0 text-center">
                        {formatCount(metrics.total_cuts)}
                      </td>
                      <td className="hidden sm:table-cell rounded-r-lg border-r-2 text-center">
                        {formatPercentage(metrics.cut_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <Card
              tone="muted"
              padding="lg"
              className="flex flex-col items-center gap-1 text-sm text-center mt-3 py-6"
            >
              <Scissors className="size-6 text-muted" />
              <p className="font-medium">The board's wide open</p>
              <p className="text-xs text-muted">
                No cuts in the last 30 days — start swiping to claim the top spot.
              </p>
            </Card>
          )}
        </div>
      )}

      {playlists &&
        metrics &&
        (() => {
          const filteredPlaylists = playlists.filter((p) => p.id !== LIKED_SONGS_ID);
          if (filteredPlaylists.length === 0) return null;

          const largestPlaylist = filteredPlaylists.reduce(
            (prev, curr) => (curr.tracks.total > prev.tracks.total ? curr : prev),
            playlists[0]
          );

          return (
            <>
              <Divider />
              <p className="text-muted text-center wrap-break-word">
                Your playlist{" "}
                <Link
                  to={`/playlists/${largestPlaylist.id}/swipe`}
                  className="text-accent underline"
                >
                  {largestPlaylist.name}
                </Link>{" "}
                has {formatCount(largestPlaylist.tracks.total)} tracks. You could cut about{" "}
                {formatCount(Math.round(largestPlaylist.tracks.total * metrics.cut_rate))}.
              </p>
            </>
          );
        })()}
    </main>
  );
};

export default LandingPage;
