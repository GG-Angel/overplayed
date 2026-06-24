import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useQueueState } from "@/features/user/api/get-queue-state";
import { useSubmitAccessRequest } from "@/features/user/api/submit-access-request";
import { accessRequestSchema, type AccessRequest } from "@/lib/types";
import { Info, Key, Plus, ThumbsUp, User } from "lucide-react";
import { useState, type SubmitEventHandler } from "react";

const RequestAccessPage = () => {
  const [isModalActive, setIsModalActive] = useState<boolean>(false);
  const [form, setForm] = useState<AccessRequest>({ name: "", email: "" });
  const [errors, setErrors] = useState<Partial<AccessRequest>>({});

  const { data: queueState } = useQueueState();
  const submitMutation = useSubmitAccessRequest(form);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (submitMutation.isPending) return;

    const result = accessRequestSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }

    setErrors({});
    submitMutation.mutate();
  };

  return (
    <main className="flex flex-col gap-6 max-w-xl py-2 self-center">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <h1>Request Access</h1>
          <Key className="text-accent hidden xs:block size-6 sm:size-8 md:size-10" />
        </div>
        <p>
          Spotify caps the number of users a third-party app like this can serve at once, so access
          is granted in turns.
        </p>
        <p>Join the queue and we'll let you in as soon as a spot frees up!</p>
        <button
          onClick={() => setIsModalActive(true)}
          className="text-muted text-sm w-fit flex items-center gap-1.5 cursor-pointer hover:underline"
        >
          <Info className="size-4" /> Why do you need these details?
        </button>
      </div>
      <Divider />
      <div className="flex flex-col gap-3 text-center">
        <h2>Availability</h2>
        {queueState ? (
          (() => {
            const active = queueState.total_active_users;
            const queued = Math.min(
              queueState.user_limit - queueState.total_active_users,
              queueState.total_queued_users
            );
            const empty = queueState.user_limit - active - queued;
            const inLine = active + queueState.total_queued_users - queueState.user_limit;
            return (
              <>
                <div className="flex justify-center items-center gap-0.5">
                  {Array.from({ length: active }).map((_, i) => (
                    <User key={`active-${i}`} className="size-10 text-destructive" />
                  ))}
                  {Array.from({ length: queued }).map((_, i) => (
                    <User key={`queued-${i}`} className="size-10 text-destructive opacity-50" />
                  ))}
                  {Array.from({ length: empty }).map((_, i) => (
                    <User key={`empty-${i}`} className="size-10 text-success" />
                  ))}
                  {inLine >= 1 && <Plus className="text-destructive opacity-50" />}
                </div>
                {!queueState.is_full ? (
                  <p className="text-sm">There is {empty} slot available — claim your spot!</p>
                ) : (
                  <p className="text-sm">
                    No slots are currently available. {inLine}{" "}
                    {inLine == 1 ? "user is" : "users are"} in line.
                  </p>
                )}
              </>
            );
          })()
        ) : (
          <div className="w-full max-w-sm self-center h-18 bg-card rounded-2xl animate-pulse" />
        )}
      </div>
      <Divider />
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <Input
          type="text"
          label="Account full name"
          hint="Note: Do not enter your username — use the full name on your account."
          placeholder="e.g., John Doe"
          value={form.name}
          error={errors.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <Input
          type="email"
          label="Account email"
          placeholder="e.g., example@gmail.com"
          value={form.email}
          error={errors.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <Button type="submit" variant="secondary" disabled={submitMutation.isPending}>
          {submitMutation.isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </form>

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
