import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";
import Modal, { type ModalProps } from "@/components/ui/Modal";
import Turnstile, { type TurnstileHandle } from "@/components/ui/Turnstile";
import { useQueueOverview } from "@/features/user/api/get-queue-overview";
import { useSendAccessRequest } from "@/features/user/api/send-access-request";
import { formatCount, formatDateTime } from "@/lib/utils";
import { Info, Key, Plus, Send, ThumbsUp, User } from "lucide-react";
import { useRef, useState, type SubmitEventHandler } from "react";
import { loadFromStorage, saveToStorage, storageKeys } from "@/lib/storage";
import { accessRequestFormSchema, type QueueAccessRequest } from "@/lib/types";
import { useAccessContext } from "@/features/user/provider/AccessContext";

const EmailCollectionModal = ({ onClose }: Pick<ModalProps, "onClose">) => {
  return (
    <Modal onClose={onClose} className="flex flex-col gap-3 max-w-2xl">
      <h2>Why we need your email</h2>
      <p>
        Spotify only lets a few approved accounts use this app at a time. When your turn comes, we
        add your email to Spotify's allowlist so you can log in.
      </p>
      <p>Use the exact email on your Spotify account — a mismatch means login will fail.</p>
      <p className="text-muted text-sm">
        Your email is used <span className="font-bold">only</span> to grant access.{" "}
        <a
          href="https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Learn more.
        </a>
      </p>
      <Button
        className="mt-2"
        icon={<ThumbsUp className="size-4" />}
        variant="secondary"
        onClick={onClose}
      >
        Understood.
      </Button>
    </Modal>
  );
};

const NoAccessModal = ({ onClose }: Pick<ModalProps, "onClose">) => {
  return (
    <Modal onClose={onClose} className="flex flex-col gap-3 max-w-2xl">
      <h2>You don't have access yet</h2>
      <p>
        To log in, request access below with your Spotify email. We'll let you in as soon as it's
        your turn.
      </p>
      <p className="text-muted text-sm">
        Already requested? Make sure you're using the exact email on your Spotify account.
      </p>
      <Button
        className="mt-2"
        icon={<ThumbsUp className="size-4" />}
        variant="secondary"
        onClick={onClose}
      >
        Understood.
      </Button>
    </Modal>
  );
};

const RequestAccessPage = () => {
  const { setHasRequestedAccess } = useAccessContext();
  const queueOverview = useQueueOverview();

  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isNoAccessModalOpen, setIsNoAccessModalOpen] = useState<boolean>(() =>
    new URLSearchParams(window.location.search).has("error")
  );

  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [errors, setErrors] = useState<Partial<QueueAccessRequest>>({});
  const [form, setForm] = useState<QueueAccessRequest>(() =>
    loadFromStorage(localStorage, storageKeys.accessForm, { email: "" })
  );

  const turnstileRef = useRef<TurnstileHandle>(null);
  const submitRequestMutation = useSendAccessRequest(form, turnstileToken);

  const validateForm = () => {
    const result = accessRequestFormSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message])));
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmitRequest: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!validateForm() || !turnstileToken) return;

    submitRequestMutation.mutate(undefined, {
      onSettled: () => {
        setTurnstileToken("");
        turnstileRef.current?.reset();
      },
      onSuccess: () => {
        saveToStorage(localStorage, storageKeys.accessForm, form);
        setHasRequestedAccess(true);
      },
    });
  };

  return (
    <main className="flex flex-col gap-6 max-w-xl pt-2 pb-8 self-center">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1>Request Access</h1>
          <Key className="text-accent shrink-0 size-6 sm:size-8 md:size-10" />
        </div>
        <p>
          Spotify limits how many users this app can serve at once, so access is granted in turns,
          24 hours at a time.
        </p>
        <p>Join the waitlist and we'll let you in as soon as a spot frees up!</p>
        <button
          onClick={() => setIsEmailModalOpen(true)}
          className="text-muted text-sm w-fit text-left flex items-center gap-1.5 cursor-pointer hover:underline"
        >
          <Info className="size-3.5" /> Why do you need my email?
        </button>
      </div>

      <Divider />

      <div className="flex flex-col gap-3 text-center">
        <h2>Availability</h2>
        {queueOverview.data ? (
          (() => {
            const total = queueOverview.data.num_active + queueOverview.data.num_queued;
            const active = Math.min(total, queueOverview.data.user_limit);
            const empty = Math.max(0, queueOverview.data.user_limit - active);
            const waiting = Math.max(0, total - queueOverview.data.user_limit);
            return (
              <>
                <div className="flex justify-center items-center gap-0.5 flex-wrap">
                  {Array.from({ length: queueOverview.data.user_limit }).map((_, i) => (
                    <User
                      key={i}
                      className={`size-10 ${i < active ? "text-muted" : "text-success"}`}
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
                      No slots are available. {formatCount(waiting)}{" "}
                      {waiting == 1 ? "user is" : "users are"} in line.
                    </p>
                    {queueOverview.data.next_available_time && (
                      <p className="text-xs text-muted">
                        Earliest available time:{" "}
                        {formatDateTime(queueOverview.data.next_available_time)}
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
        <div className="flex flex-col xs:justify-between xs:flex-row gap-6 xs:gap-3">
          <div className="flex flex-col flex-1 gap-1.5">
            <Input
              type="email"
              label="Spotify account email"
              placeholder="user@example.com"
              value={form.email}
              error={errors.email}
              disabled={submitRequestMutation.isPending}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              onBlur={validateForm}
            />
            <span className="text-sm text-muted">
              You can find your email{" "}
              <a
                href="https://www.spotify.com/account/profile/"
                className="underline hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
              >
                here.
              </a>
            </span>
          </div>
          <Button
            className="h-11 xs:mt-7"
            icon={<Send className="size-4 shrink-0" />}
            type="submit"
            size="lg"
            disabled={submitRequestMutation.isPending || !turnstileToken || !form.email}
          >
            Send Request
          </Button>
        </div>
        <Turnstile
          ref={turnstileRef}
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken("")}
          onError={() => setTurnstileToken("")}
        />
      </form>

      <div>{submitRequestMutation.data?.status ?? "No request sent yet."}</div>

      {isEmailModalOpen && <EmailCollectionModal onClose={() => setIsEmailModalOpen(false)} />}
      {isNoAccessModalOpen && <NoAccessModal onClose={() => setIsNoAccessModalOpen(false)} />}
    </main>
  );
};

export default RequestAccessPage;
