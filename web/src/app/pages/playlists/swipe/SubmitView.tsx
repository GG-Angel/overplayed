import useSubmitReview, { type StepStatus } from "@/hooks/useSubmitChanges";
import { useSwipeContext } from "./SwipeContext";
import { Ban, Check, Ellipsis, LoaderCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useEffectEvent } from "react";
import type { ReviewForm } from "@/hooks/useReviewForm";

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
};

const SubmitView = ({ form }: SubmitViewProps) => {
  const { id, dislikes } = useSwipeContext();
  const { state, submit } = useSubmitReview(id);

  const kaomoji = "( ◡̀_◡́)ᕤ";

  const runSubmit = useEffectEvent(() => {
    const uris = dislikes.map((item) => item.track.uri);
    submit(form, uris);
  });

  useEffect(() => {
    runSubmit();
  }, []);

  return (
    <div className="flex flex-col h-full justify-center gap-6">
      <div className="text-center">
        <p className="text-4xl mb-2">{kaomoji}</p>
        <p className="text-xl font-medium">Processing Changes</p>
      </div>
      <div className="flex flex-col items-start self-center gap-3">
        <ActionItem label="Create new playlist" status={state.creating} />
        <ActionItem label="Back up removed tracks" status={state.adding} />
        <ActionItem
          label={`Remove ${dislikes.length} track(s) from playlist`}
          status={state.removing}
        />
      </div>
    </div>
  );
};

export default SubmitView;
