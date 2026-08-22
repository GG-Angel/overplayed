import Metric, { MetricSkeleton } from "@/components/ui/Metric";
import Button from "@/components/ui/Button";
import SpotifyIcon from "@/assets/spotify.svg?react";
import { Link, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Divider from "@/components/ui/Divider";
import SwipeButtons from "@/features/swipe/components/SwipeButtons";
import SwipeCardStack from "@/features/swipe/components/SwipeCardStack";
import useAutoSwipe from "@/features/swipe/hooks/useAutoSwipe";
import carouselTracks from "@/assets/carousel-tracks.json";
import z from "zod";
import { Key, Scissors, Undo } from "lucide-react";
import Image from "@/components/ui/Image";
import { useMemo } from "react";
import {
  cn,
  fallbackImageUrl,
  formatCount,
  formatPercentage,
  openExternalUrl,
  shuffleArray,
} from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { motion } from "framer-motion";
import { trackSchema } from "@/types/spotify";
import { LIKED_SONGS_PLAYLIST_ID } from "@/lib/constants";
import { useCounters, useLeaderboard, usePlaylists } from "@/api/queries";
import useAuth from "@/features/session/auth/useAuth";
import { useAuthContext } from "@/features/session/auth/AuthContext";

const CAROUSEL_TRACKS = z.array(trackSchema).parse(carouselTracks);
const LEADERBOARD_ROWS = 5;
const STEPS = [
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

const CallToAction = () => {
  const navigate = useNavigate();
  const { user, isLoading, login } = useAuth();
  const { hasRequestedAccess } = useAuthContext();

  return (
    <div className="flex flex-col-reverse items-center justify-center xs:flex-row gap-3 w-full max-w-xl self-center">
      {isLoading && <Spinner className="flex items-center h-10" size="sm" />}

      {!isLoading &&
        (user ? (
          <Button
            key="view-playlists-btn"
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
              key="request-access-btn"
              icon={<Key className="size-5 shrink-0" />}
              className={cn(
                "overflow-visible group relative flex items-center",
                hasRequestedAccess ? "w-full" : "self-center"
              )}
              size="lg"
              variant={hasRequestedAccess ? "secondary" : "primary"}
              onClick={() => navigate("/access")}
            >
              Request Access
              <motion.div
                initial={{ opacity: 0, scale: 0.75, rotate: 4 }}
                animate={{ opacity: 1, scale: 1, rotate: 3 }}
                transition={{ delay: 0.6, duration: 0.25 }}
                hidden={hasRequestedAccess}
                className="absolute pointer-events-none origin-bottom-left -top-3/5 left-full text-primary/75 hidden xs:flex items-center gap-2"
              >
                <Undo className="-rotate-24" />
                Start here!
              </motion.div>
            </Button>
            <Button
              key="log-in"
              hidden={!hasRequestedAccess}
              icon={<SpotifyIcon className="size-5 shrink-0" />}
              className="w-full"
              size="lg"
              variant="primary"
              onClick={login}
            >
              Log in with Spotify
            </Button>
          </>
        ))}
    </div>
  );
};

const Leaderboard = () => {
  const { data: leaderboard } = useLeaderboard();

  if (!leaderboard) {
    return (
      <div className="flex flex-col gap-1.5 mt-4">
        {Array.from({ length: LEADERBOARD_ROWS }).map((_, i) => (
          <Card
            key={`leaderboard-row-${i}`}
            tone="muted"
            radius="sm"
            className="animate-pulse h-11 w-full"
          />
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card
        tone="muted"
        padding="lg"
        className="flex flex-col items-center gap-1 text-sm text-center mt-3 py-6"
      >
        <Scissors className="size-6 text-muted" />
        <p className="font-medium">The board's wide open</p>
        <p className="text-xs text-muted">Start swiping to claim the top spot.</p>
      </Card>
    );
  }

  return (
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
        {leaderboard.slice(0, LEADERBOARD_ROWS).map(({ user, metrics }, index) => (
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
  );
};

const LandingPage = () => {
  const carousel = useAutoSwipe(useMemo(() => shuffleArray(CAROUSEL_TRACKS), []));
  const { data: metrics } = useCounters();
  const { data: playlists } = usePlaylists();

  const metricsDisplayed = [
    { label: "Songs swiped", amount: metrics && formatCount(metrics.total_swipes) },
    { label: "Cut rate", amount: metrics && formatPercentage(metrics.cut_rate) },
    { label: "Songs cut", amount: metrics && formatCount(metrics.total_cuts) },
  ];

  const largestPlaylist = playlists
    ?.filter((p) => p.id !== LIKED_SONGS_PLAYLIST_ID)
    ?.reduce<(typeof playlists)[number] | undefined>((prev, curr) => {
      if (!prev) return curr;
      return curr.tracks.total > prev.tracks.total ? curr : prev;
    }, undefined);

  return (
    <main className="flex flex-col gap-8 w-full max-w-3xl self-center py-8">
      <h1 className="text-center">
        <span className="block">Your playlist is bloated.</span>
        <span className="block text-muted">
          <span className="text-primary">Swipe</span> the dead weight away.
        </span>
      </h1>
      <h3 className="text-center self-center max-w-100 sm:max-w-md">
        Tinder for your playlists. Swipe right to keep, left to cut. Clean up years of saved songs
        in minutes.
      </h3>
      <CallToAction />

      <Card
        className="flex flex-col items-center gap-6 pointer-events-none py-6"
        tone="muted"
        radius="lg"
        padding="lg"
      >
        <SwipeCardStack
          topCardRef={carousel.currentCardRef}
          tracks={carousel.displayedTracks}
          onSwipeEnd={carousel.moveToNextTrack}
        />
        <SwipeButtons />
      </Card>

      <div className="flex flex-col gap-3">
        <h3 className="text-center">Three steps toward a cleaner playlist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STEPS.map((step, index) => (
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

      <div className="flex flex-col gap-3">
        <h3 className="text-center">By the numbers</h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
          {metricsDisplayed.map((metric, i) =>
            metric.amount ? (
              <Metric
                key={metric.label}
                label={metric.label}
                amount={metric.amount}
                tone="muted"
                className="first:col-span-1 xs:first:col-span-2 sm:first:col-span-1"
              />
            ) : (
              <MetricSkeleton key={`metric-skeleton-${i}`} tone="muted" />
            )
          )}
        </div>
      </div>

      <div className="flex flex-col overflow-auto">
        <h3 className="text-center">Top users</h3>
        <p className="text-xs text-center text-muted">Based on tracks cut, last 30 days</p>
        <Leaderboard />
      </div>

      {largestPlaylist && metrics && (
        <>
          <Divider />
          <p className="text-muted text-center wrap-break-word">
            Your playlist{" "}
            <Link to={`/playlists/${largestPlaylist.id}/swipe`} className="text-accent underline">
              {largestPlaylist.name}
            </Link>{" "}
            has {formatCount(largestPlaylist.tracks.total)} tracks. You could cut about{" "}
            {formatCount(Math.round(largestPlaylist.tracks.total * metrics.cut_rate))}.
          </p>
        </>
      )}
    </main>
  );
};

export default LandingPage;
