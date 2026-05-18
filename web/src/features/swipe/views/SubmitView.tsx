import { useSwipeContext } from "../context/SwipeContext";
import { Ban, Check, Ellipsis, LoaderCircle, X } from "lucide-react";
import { cn, pluralize } from "@/lib/utils";
import { useEffect, useEffectEvent } from "react";
import type { ReviewForm } from "@/features/swipe/hooks/useReviewForm";
import useSubmitChanges, { type StepStatus } from "../hooks/useSubmitChanges";
import type { Playlist } from "@/lib/types";

type ActionItemProps = {
  label: string;
  status: StepStatus;
};

const StatusStyles = {
  pending: {
    icon: Ellipsis,
    iconClassName: "text-muted-foreground animate-pulse",
  },
  active: {
    icon: LoaderCircle,
    iconClassName: "animate-spin",
  },
  success: {
    icon: Check,
    iconClassName: "text-primary",
  },
  skipped: {
    icon: Ban,
    iconClassName: "text-muted-foreground",
  },
  error: {
    icon: X,
    iconClassName: "text-destructive",
  },
};

const ActionItem = ({ label, status }: ActionItemProps) => {
  const { icon: Icon, iconClassName } = StatusStyles[status];
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("inline-block", iconClassName)} />
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
};

type SubmitViewProps = {
  form: ReviewForm;
  onSuccess?: (newPlaylist: Playlist | null) => void;
  onError?: (error: Error | null) => void;
};

const SubmitView = ({ form, onSuccess, onError }: SubmitViewProps) => {
  const { id, dislikes } = useSwipeContext();
  const { state, submit } = useSubmitChanges(id);

  const runSubmit = useEffectEvent(async () => {
    const uris = dislikes.map((item) => item.track.uri);
    await submit(form, uris);
  });

  useEffect(() => {
    runSubmit();
  }, []);

  useEffect(() => {
    if (state.phase !== "done" && state.phase !== "failed") return;

    const timer = setTimeout(() => {
      if (state.phase === "done") onSuccess?.(state.newPlaylist);
      if (state.phase === "failed") onError?.(state.error);
    }, 2500); // wait 2.5 sec before moving to next page

    return () => {
      clearTimeout(timer);
    };
  }, [state.phase, state.error, state.newPlaylist, onError, onSuccess]);

  return (
    <div className="flex flex-col h-full justify-center gap-6">
      <div className="text-center">
        <p className="text-4xl mb-2">{"( ◡̀_◡́)ᕤ"}</p>
        <p className="text-xl font-medium">Processing Changes</p>
      </div>
      <div className="flex flex-col items-start self-center gap-3">
        <ActionItem label="Create new playlist" status={state.creating} />
        <ActionItem label="Back up tracks" status={state.backingUp} />
        <ActionItem
          label={`Remove ${dislikes.length} ${pluralize("track", dislikes.length)}`}
          status={state.removing}
        />
      </div>
    </div>
  );
};

export default SubmitView;
