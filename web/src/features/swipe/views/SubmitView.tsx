import { useSwipeContext } from "../context/SwipeContext";
import { pluralize } from "@/lib/utils";
import { useEffect, useEffectEvent } from "react";
import type { ReviewForm } from "@/features/swipe/hooks/useReviewForm";
import useSubmitChanges from "../hooks/useSubmitChanges";
import SubmitAction from "../components/SubmitAction";

const SUBMISSION_DELAY = 2000;

type SubmitViewProps = {
  form: ReviewForm;
};

const SubmitView = ({ form }: SubmitViewProps) => {
  const { playlistId, dislikes, succeed, fail } = useSwipeContext();
  const { state, submit } = useSubmitChanges(playlistId, succeed, fail, SUBMISSION_DELAY);

  // submit form on mount
  const runSubmit = useEffectEvent(async () => {
    const uris = dislikes.map((item) => item.track.uri);
    await submit(form, uris);
  });

  useEffect(() => {
    runSubmit();
  }, []);

  return (
    <div className="flex flex-col h-full justify-center gap-6">
      <div className="text-center">
        <p className="text-4xl mb-2 text-primary">{"( ◡̀_◡́)ᕤ"}</p>
        <p className="text-xl font-medium">Processing Changes</p>
      </div>
      <div className="flex flex-col items-start self-center gap-3">
        <SubmitAction label="Create new playlist" status={state.creating} />
        <SubmitAction label="Back up tracks" status={state.backingUp} />
        <SubmitAction
          label={`Remove ${dislikes.length} ${pluralize("track", dislikes.length)}`}
          status={state.removing}
        />
      </div>
    </div>
  );
};

export default SubmitView;
