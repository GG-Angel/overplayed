import Button from "@/components/ui/Button";
import SpotifyIcon from "@/assets/spotify.svg?react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import useAuth from "@/features/user/auth/useAuth";
import Card from "@/components/ui/Card";
import Metric from "@/components/ui/Metric";

type StepCardProps = {
  index: number;
  heading: string;
  body: string;
};

const StepCard = ({ index, heading, body }: StepCardProps) => {
  return (
    <Card className="flex flex-col gap-2">
      <p className="bg-card-foreground text-background font-semibold text-center p-1 w-fit rounded-full aspect-square">
        {index}
      </p>
      <div>
        <p className="text-sm sm:text-base font-medium">{heading}</p>
        <p className="text-xs sm:text-sm text-muted-foreground">{body}</p>
      </div>
    </Card>
  );
};

const LandingPage = () => {
  const { user, isLoading, redirectToLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const steps: Omit<StepCardProps, "index">[] = [
    {
      heading: "Pick a playlist",
      body: "Connect Spotify and choose any playlist. Even the 2,000-song dumpster fire.",
    },
    {
      heading: "Swipe through it",
      body: "A 30-second preview plays for each track. Swipe right to keep, left to cut.",
    },
    {
      heading: "Confirm the purge",
      body: "Review the cuts, back them up if you want, then delete in one click.",
    },
  ];

  if (isLoading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-12 max-w-4xl self-center">
      <div className="flex flex-col gap-3 text-center">
        <p className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-8 sm:leading-9 md:leading-12">
          <span className="block">Your playlist is bloated.</span>
          <span className="block text-muted-foreground">Swipe the dead weight away.</span>
        </p>
        <p className="font-medium">
          <span className="block">
            Tinder for your playlists. Swipe right to keep, left to cut.
          </span>
          <span className="block">Clean up years of saved songs in minutes.</span>
        </p>
        <Button
          className="self-center"
          size="lg"
          variant={user ? "secondary" : "primary"}
          icon={<SpotifyIcon className="size-5" />}
          onClick={() => (user ? navigate("/playlists") : redirectToLogin(location.pathname))}
        >
          {user ? "View your playlists" : "Log in with Spotify"}
        </Button>
      </div>
      <Card>what the helly</Card>
      <div className="flex flex-col gap-3">
        <p className="text-xl font-medium text-center">Three steps toward a cleaner library</p>
        <div className="grid grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <StepCard index={i + 1} {...step} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Metric amount={3} label="what" tone="muted" />
        <Metric amount={3} label="what" tone="muted" />
        <Metric amount={3} label="what" tone="muted" />
      </div>
    </div>
  );
};

export default LandingPage;
