import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";
import Modal, { type ModalProps } from "@/components/ui/Modal";
import Turnstile, { type TurnstileHandle } from "@/components/ui/Turnstile";
import { formatCount, formatDateTime } from "@/lib/utils";
import {
  Check,
  CircleQuestionMark,
  Clock,
  Info,
  Key,
  Mail,
  Plus,
  Send,
  ThumbsUp,
  User,
} from "lucide-react";
import { useRef, useState, type SubmitEventHandler } from "react";
import { loadFromStorage, saveToStorage, storageKeys } from "@/lib/storage";
import { useAccessContext } from "@/features/user/provider/AccessContext";
import Card from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useSearchParams } from "react-router-dom";
import {
  accessRequestFormSchema,
  type AccessRequestForm,
  type AccessRequestResult,
} from "@/types/queue";
import { useAccessStatus, useQueueStatus } from "@/api/queries";
import { useRequestAccess } from "@/api/mutations";

const ErrorNotice = ({ message }: { message: string }) => {
  return (
    <Card tone="negative" padding="lg" radius="lg" className="flex flex-col gap-2 py-4">
      {message}
    </Card>
  );
};

type NoticeModalProps = Pick<ModalProps, "onClose" | "children"> & {
  title: string;
  dismissLabel: string;
};

const NoticeModal = ({ title, dismissLabel, onClose, children }: NoticeModalProps) => {
  return (
    <Modal onClose={onClose} className="flex flex-col gap-3 max-w-2xl">
      <h2>{title}</h2>
      {children}
      <Button
        className="mt-2"
        icon={<ThumbsUp className="size-4" />}
        variant="secondary"
        onClick={onClose}
      >
        {dismissLabel}
      </Button>
    </Modal>
  );
};

const EmailCollectionModal = ({ onClose }: Pick<ModalProps, "onClose">) => {
  return (
    <NoticeModal title="Why we need your email" dismissLabel="Understood." onClose={onClose}>
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
    </NoticeModal>
  );
};

type AuthErrorNotice = Omit<NoticeModalProps, "onClose">;

const authErrorNotices: Record<string, AuthErrorNotice | undefined> = {
  no_access: {
    title: "You don't have access yet",
    dismissLabel: "Understood.",
    children: (
      <>
        <p>
          To log in, request access below with your Spotify email. We'll let you in as soon as it's
          your turn.
        </p>
        <p className="text-muted text-sm">
          Already requested? Make sure you're using the exact email on your Spotify account.
        </p>
      </>
    ),
  },
  invalid_token: {
    title: "This verification link has expired",
    dismissLabel: "Got it.",
    children: (
      <p>
        Verification links are only valid for 15 minutes. Please request access again, and we'll
        send you a fresh link.
      </p>
    ),
  },
};

const AccessStatusCard = ({ data }: { data: AccessRequestResult }) => {
  const { status, email } = data;

  if (status === "confirmation_sent") {
    return (
      <Card tone="muted" padding="lg" radius="lg" className="flex flex-col gap-2 py-6">
        <h2 className="flex items-center gap-2">
          <Mail className="shrink-0" /> Check Your Inbox
        </h2>
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">
            We've sent a verification email to <span className="text-accent">{email}</span>
          </p>
          <p>Follow the link in the email to confirm your request.</p>
        </div>
        <p className="text-muted text-sm">Don't see it? Check your spam folder.</p>
      </Card>
    );
  }

  if (status === "in_queue") {
    return (
      <Card tone="muted" padding="lg" radius="lg" className="flex flex-col gap-2 py-6">
        <h2 className="flex items-center gap-2">
          <Clock className="shrink-0" /> Waiting In Queue
        </h2>
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">
            {email} is <span className="text-success">#{data.position_in_queue}</span> in line.
          </p>
          <p className="text-muted">Access opens at {formatDateTime(data.estimated_start_time)}.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card tone="positive" padding="lg" radius="lg" className="flex flex-col gap-2 py-6">
      <h2 className="flex items-center gap-2">
        <Check className="shrink-0" /> Account Activated
      </h2>
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{email} is in!</p>
        <p className="brightness-80">
          Access is available until {formatDateTime(data.estimated_end_time)}.
        </p>
      </div>
    </Card>
  );
};

const RequestAccessPage = () => {
  const { setHasRequestedAccess } = useAccessContext();
  const queueOverview = useQueueStatus();

  const [searchParams] = useSearchParams();
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [errors, setErrors] = useState<Partial<AccessRequestForm>>({});
  const [form, setForm] = useState<AccessRequestForm>(() => {
    if (searchParams.has("email")) {
      return { email: searchParams.get("email") ?? "" };
    }
    return loadFromStorage(localStorage, storageKeys.accessForm, { email: "" });
  });
  const [submittedForm, setSubmittedForm] = useState(form);

  const [resultSource, setResultSource] = useState<"status" | "request" | null>(() =>
    form.email ? "status" : null
  );
  const authErrorNotice = authErrorNotices[searchParams.get("error") ?? ""];
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !!authErrorNotice);

  const turnstileRef = useRef<TurnstileHandle>(null);
  const submitRequestMutation = useRequestAccess(form, turnstileToken);
  const userStatusQuery = useAccessStatus(form.email);

  const validateForm = () => {
    const result = accessRequestFormSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message])));
      return false;
    }
    setErrors({});
    return true;
  };

  const handleCheckStatus = () => {
    if (!validateForm()) return;

    setSubmittedForm(form);
    setResultSource("status");
    submitRequestMutation.reset();
    userStatusQuery.refetch();
  };

  const handleSubmitRequest: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!validateForm() || !turnstileToken) return;

    setSubmittedForm(form);
    setResultSource("request");

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

  const results = {
    request: {
      isPending: submitRequestMutation.isPending,
      isError: submitRequestMutation.isError,
      errorMessage: (email: string) => `Failed to send request for ${email}. Please try again.`,
      data: submitRequestMutation.data,
    },
    status: {
      isPending: userStatusQuery.isFetching,
      isError: userStatusQuery.isError,
      errorMessage: (email: string) => `The account for ${email} is inactive.`,
      data: userStatusQuery.data,
    },
  };

  const result = resultSource ? results[resultSource] : null;

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

      <form className="flex flex-col gap-4" onSubmit={handleSubmitRequest}>
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
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            icon={<CircleQuestionMark className="size-4 shrink-0" />}
            className="sm:flex-1"
            variant="secondary"
            size="lg"
            type="button"
            disabled={submitRequestMutation.isPending || !form.email}
            onClick={handleCheckStatus}
          >
            Check Status
          </Button>
          <Button
            icon={<Send className="size-4 shrink-0" />}
            className="sm:flex-1"
            type="submit"
            size="lg"
            disabled={submitRequestMutation.isPending || !turnstileToken || !form.email}
          >
            Send Request
          </Button>
        </div>

        <Turnstile
          className="mt-2"
          ref={turnstileRef}
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken("")}
          onError={() => setTurnstileToken("")}
        />
      </form>

      {result && <Divider />}

      {result?.isPending && (
        <div className="flex flex-col items-center gap-2 text-muted">
          <Spinner />
          <p className="text-sm">Processing request...</p>
        </div>
      )}

      {!result?.isPending && result?.isError && (
        <ErrorNotice message={result.errorMessage(submittedForm.email)} />
      )}

      {!result?.isPending && !result?.isError && result?.data && (
        <AccessStatusCard data={result.data} />
      )}

      {isEmailModalOpen && <EmailCollectionModal onClose={() => setIsEmailModalOpen(false)} />}
      {isAuthModalOpen && authErrorNotice && (
        <NoticeModal {...authErrorNotice} onClose={() => setIsAuthModalOpen(false)} />
      )}
    </main>
  );
};

export default RequestAccessPage;
