import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAccessStatus } from "@/features/user/api/get-access-status";
import { useQueueStatus } from "@/features/user/api/get-queue-state";
import { useSubmitAccessRequest } from "@/features/user/api/submit-access-request";
import { kaomojis } from "@/lib/kaomoji";
import { accessRequestSchema, type AccessRequest } from "@/lib/types";
import { formatCount, formatDateTime } from "@/lib/utils";
import { CircleQuestionMark, Info, Key, Mail, Plus, ThumbsUp, User } from "lucide-react";
import { useState, type SubmitEventHandler } from "react";

const ErrorStatus = ({ message }: { message: string }) => (
  <Card tone="negative" padding="lg" radius="lg" className="flex flex-col gap-2 py-4">
    <p>
      <span className="font-medium">Error:</span> {message}
    </p>
  </Card>
);

const AdmittedStatus = ({ name, endTime }: { name: string; endTime: string }) => (
  <Card tone="positive" padding="lg" radius="lg" className="flex flex-col gap-2 py-6">
    <h2>{name}'s Status</h2>
    <div className="flex flex-col gap-0.5">
      <p className="font-medium">
        You're in! <span className="text-success">{kaomojis.working}</span>
      </p>
      <p className="brightness-50">You have access until {formatDateTime(endTime)}.</p>
    </div>
  </Card>
);

const QueuedStatus = ({
  name,
  position,
  startTime,
}: {
  name: string;
  position: number;
  startTime: string;
}) => (
  <Card tone="muted" padding="lg" radius="lg" className="flex flex-col gap-2 py-6">
    <h2>{name}'s Status</h2>
    <div className="flex flex-col gap-0.5">
      <p className="font-medium">
        You're <span className="text-success">#{position}</span> in line.
      </p>
      <p className="text-muted">Access opens at {formatDateTime(startTime)}.</p>
    </div>
  </Card>
);

const RequestAccessPage = () => {
  const [isModalActive, setIsModalActive] = useState<boolean>(false);
  const [form, setForm] = useState<AccessRequest>({ name: "", email: "" });
  const [errors, setErrors] = useState<Partial<AccessRequest>>({});

  const queueStatus = useQueueStatus();
  const accessStatus = useAccessStatus(form);
  const submitMutation = useSubmitAccessRequest(form);

  const validateForm = () => {
    const result = accessRequestSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message])));
      return false;
    }
    setErrors({});
    return true;
  };

  const handleCheckStatus = () => {
    if (submitMutation.isPending) return;
    if (!validateForm()) return;
    accessStatus.refetch();
  };

  const handleSubmitRequest: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (submitMutation.isPending) return;
    if (!validateForm()) return;
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
            const total = queueStatus.data.active_users + queueStatus.data.queued_users;
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
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <Button
            icon={<CircleQuestionMark className="size-4" />}
            type="button"
            variant="secondary"
            onClick={handleCheckStatus}
            disabled={accessStatus.isFetching}
          >
            Check Status
          </Button>
          <Button
            icon={<Mail className="size-4" />}
            type="submit"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>

      {/* Results */}
      {submitMutation.isPending || accessStatus.isLoading ? (
        <Spinner className="self-center my-2" />
      ) : submitMutation.isError ? (
        <ErrorStatus
          message={
            submitMutation.error.response?.data.detail ?? "Failed to submit. Please try again."
          }
        />
      ) : accessStatus.isError ? (
        <ErrorStatus message="User isn't active or in the queue." />
      ) : (
        accessStatus.isSuccess &&
        (accessStatus.data.admitted ? (
          <AdmittedStatus name={accessStatus.data.user.name} endTime={accessStatus.data.end_time} />
        ) : (
          <QueuedStatus
            name={accessStatus.data.user.name}
            position={accessStatus.data.position!}
            startTime={accessStatus.data.start_time}
          />
        ))
      )}

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
