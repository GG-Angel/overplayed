import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import Turnstile from "@/components/ui/Turnstile";
import { useQueueStatus } from "@/features/user/api/get-queue-state";
import { useSubmitAccessRequest } from "@/features/user/api/submit-access-request";
import { kaomojis } from "@/lib/kaomoji";
import { formatCount, formatDateTime } from "@/lib/utils";
import { Info, Key, Mail, Plus, ThumbsUp, User } from "lucide-react";
import { useState, type SubmitEventHandler } from "react";
import {
  queueAccessRequestSchema,
  type QueueAccessRequest,
  type QueueUserStatus,
} from "@/lib/types";

const ErrorMessage = ({ message }: { message: string }) => (
  <Card tone="negative" padding="lg" radius="lg" className="flex flex-col gap-2 py-4">
    {message}
  </Card>
);

const AccessResult = ({ data }: { data: QueueUserStatus }) => {
  const status = data.status;

  if (status === "in_queue") {
    const { name, position_in_queue, estimated_start_time } = data;
    return (
      <Card tone="muted" padding="lg" radius="lg" className="flex flex-col gap-2 py-6">
        <h2>{name}'s Status</h2>
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">
            You're <span className="text-success">#{position_in_queue}</span> in line.
          </p>
          <p className="text-muted">Access opens at {formatDateTime(estimated_start_time)}.</p>
        </div>
      </Card>
    );
  }

  const { name, estimated_end_time } = data;
  return (
    <Card tone="positive" padding="lg" radius="lg" className="flex flex-col gap-2 py-6">
      <h2>{name}'s Status</h2>
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">
          You're in! <span className="text-success">{kaomojis.working}</span>
        </p>
        <p className="brightness-80">You have access until {formatDateTime(estimated_end_time)}.</p>
      </div>
    </Card>
  );
};

const RequestAccessPage = () => {
  const [isModalActive, setIsModalActive] = useState<boolean>(false);
  const [form, setForm] = useState<QueueAccessRequest>({ name: "", email: "" });
  const [errors, setErrors] = useState<Partial<QueueAccessRequest>>({});
  const [token, setToken] = useState<string>("");

  const queueStatus = useQueueStatus();
  const submitMutation = useSubmitAccessRequest(form, token);

  const validateForm = () => {
    const result = queueAccessRequestSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message])));
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmitRequest: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!validateForm() || !token) return;
    submitMutation.mutate();
  };

  return (
    <main className="flex flex-col gap-6 max-w-xl pt-2 pb-8 self-center">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1>Request Access</h1>
          <Key className="text-accent shrink-0 size-6 sm:size-8 md:size-10" />
        </div>
        <p>
          Spotify limits how many users a third-party app like this can serve at once, so access is
          granted in turns, 24 hours at a time.
        </p>
        <p>Join the queue and we'll let you in as soon as a spot frees up!</p>
        <button
          onClick={() => setIsModalActive(true)}
          className="text-muted text-sm w-fit text-left flex items-center gap-1.5 cursor-pointer hover:underline"
        >
          <Info className="size-4" /> Why do you need these details?
        </button>
      </div>
      <Divider />
      <div className="flex flex-col gap-3 text-center">
        <h2>Availability</h2>
        {queueStatus.data ? (
          (() => {
            const total = queueStatus.data.num_active + queueStatus.data.num_queued;
            const active = Math.min(total, queueStatus.data.user_limit);
            const empty = Math.max(0, queueStatus.data.user_limit - active);
            const waiting = Math.max(0, total - queueStatus.data.user_limit);
            return (
              <>
                <div className="flex justify-center items-center gap-0.5 flex-wrap">
                  {Array.from({ length: queueStatus.data.user_limit }).map((_, i) => (
                    <User
                      key={i}
                      className={`size-10 ${i < active ? "text-destructive" : "text-success"}`}
                    />
                  ))}
                  {waiting > 0 && <Plus className="text-destructive" />}
                </div>
                {empty > 0 ? (
                  <p className="text-sm">
                    There {empty == 1 ? `is ${empty} slot` : `are ${empty} slots`} available — claim
                    your spot!
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm">
                      No slots are currently available. {formatCount(waiting)}{" "}
                      {waiting == 1 ? "user is" : "users are"} in line.
                    </p>
                    {queueStatus.data.next_available_time && (
                      <p className="text-xs text-muted">
                        Next available time: {formatDateTime(queueStatus.data.next_available_time)}
                      </p>
                    )}
                  </div>
                )}
              </>
            );
          })()
        ) : (
          <div className="w-full max-w-sm self-center h-18 bg-card rounded-2xl animate-pulse" />
        )}
      </div>
      <Divider />
      <form className="flex flex-col gap-6" onSubmit={handleSubmitRequest}>
        <Input
          type="text"
          label="Account full name"
          hint="Note: Do not enter your username — use the full name on your account."
          placeholder="e.g., John Doe"
          value={form.name}
          error={errors.name}
          disabled={submitMutation.isPending}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          onBlur={validateForm}
        />
        <Input
          type="email"
          label="Account email"
          placeholder="e.g., example@gmail.com"
          value={form.email}
          error={errors.email}
          disabled={submitMutation.isPending}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          onBlur={validateForm}
        />
        <Turnstile
          className="self-center"
          onVerify={setToken}
          onExpire={() => setToken("")}
          onError={() => setToken("")}
        />
        <Button
          icon={<Mail className="size-4" />}
          type="submit"
          disabled={submitMutation.isPending || !token}
        >
          Submit Request
        </Button>
      </form>

      {/* Results */}
      {submitMutation.isPending && <Spinner className="self-center my-2" />}
      {submitMutation.isError && (
        <ErrorMessage
          message={
            submitMutation.error.response?.data.detail ??
            "Failed to submit request. Please try again."
          }
        />
      )}
      {submitMutation.isSuccess && <AccessResult data={submitMutation.data} />}

      {/* Modal */}
      {isModalActive && (
        <Modal onClose={() => setIsModalActive(false)} className="flex flex-col gap-3">
          <h2>Why we need these details</h2>
          <p>
            Spotify only lets a few approved accounts use this small app at a time. When your turn
            comes, you're added to the allowlist automatically.
          </p>
          <p>
            For that to work, your name and email must match your Spotify account exactly. A
            mismatch means login will fail, so be precise. These fields map directly to Spotify's
            User Management table.
          </p>
          <p>
            Read more about these limitations{" "}
            <a
              href="https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              here.
            </a>
          </p>
          <p className="text-muted text-sm">
            These details are used <span className="font-bold">only</span> to grant access. Nothing
            else.
          </p>
          <Button
            className="mt-2"
            icon={<ThumbsUp className="size-4" />}
            variant="secondary"
            onClick={() => setIsModalActive(false)}
          >
            Understood.
          </Button>
        </Modal>
      )}
    </main>
  );
};

export default RequestAccessPage;
