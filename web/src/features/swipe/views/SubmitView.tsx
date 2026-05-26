import { useSwipeContext } from "../context/SwipeContext";
import { pluralize } from "@/lib/utils";
import { useEffect, useEffectEvent } from "react";
import type { SwipeForm } from "@/features/swipe/hooks/useSwipeForm";
import useSwipeSubmit from "../hooks/useSwipeSubmit";
import SwipeSubmitStep from "../components/SwipeSubmitStep";
import MessageState from "@/components/states/MessageState";

const SUBMISSION_DELAY = 2000;

type SubmitViewProps = {
  form: SwipeForm;
};

const SubmitView = ({ form }: SubmitViewProps) => {
  const { playlistId, dislikes, succeed, fail } = useSwipeContext();
  const { state, submit } = useSwipeSubmit(playlistId, succeed, fail, SUBMISSION_DELAY);

  // submit form on mount
  const runSubmit = useEffectEvent(async () => {
    const uris = dislikes.map((item) => item.track.uri);
    await submit(form, uris);
  });

  useEffect(() => {
    runSubmit();
  }, []);

  return (
    <MessageState
      kaomoji="( ◡̀_◡́)ᕤ"
      title="Processing Changes"
      body={
        <div className="flex flex-col items-start self-center gap-3">
          <SwipeSubmitStep label="Create new playlist" status={state.creating} />
          <SwipeSubmitStep label="Back up tracks" status={state.backingUp} />
          <SwipeSubmitStep
            label={`Remove ${dislikes.length} ${pluralize("track", dislikes.length)}`}
            status={state.removing}
          />
        </div>
      }
    />
  );
};

export default SubmitView;
