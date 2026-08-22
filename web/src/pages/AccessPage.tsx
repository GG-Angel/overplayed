import Button from "@/components/ui/buttons/Button";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";
import Modal, { type ModalProps } from "@/components/ui/Modal";
import Turnstile, { type TurnstileHandle } from "@/features/session/auth/Turnstile";
import { formatDateTime } from "@/lib/utils";
import { Check, CircleQuestionMark, Clock, Info, Key, Mail, Send, ThumbsUp } from "lucide-react";
import { useRef, useState, type SubmitEventHandler } from "react";
import { loadFromStorage, saveToStorage, storageKeys } from "@/lib/storage";
import AvailabilityMeter from "@/features/session/components/AvailabilityMeter";
import ExternalLink from "@/components/ui/ExternalLink";
import Page from "@/components/layout/Page";
import { Spinner } from "@/components/ui/Spinner";
import { useSearchParams } from "react-router-dom";
import {
  accessRequestFormSchema,
  type AccessRequestForm,
  type AccessRequestResult,
} from "@/types/queue";
import { useAccessStatus, useQueueStatus } from "@/api/queries";
import { useRequestAccess } from "@/api/mutations";
import { useAuthContext } from "@/features/session/auth/AuthContext";
import Card from "@/components/ui/cards/Card";
import StatusCard from "@/components/ui/cards/StatusCard";

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
      <Button className="mt-2" icon={ThumbsUp} variant="secondary" onClick={onClose}>
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
        <ExternalLink
          href="https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security"
          className="text-accent"
        >
          Learn more.
        </ExternalLink>
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

  if (status === "confirmation_sent" || status === "confirmation_pending") {
    return (
      <StatusCard
        tone="muted"
        icon={Mail}
        title={status === "confirmation_sent" ? "Check Your Inbox" : "Verification Pending"}
      >
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">
            We've sent a verification email to <span className="text-accent">{email}</span>
          </p>
          <p>Follow the link in the email to confirm your request.</p>
        </div>
        <p className="text-muted text-sm">Don't see it? Check your spam folder.</p>
      </StatusCard>
    );
  }

  if (status === "in_queue") {
    return (
      <StatusCard tone="muted" icon={Clock} title="Waiting In Queue">
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">
            {email} is <span className="text-success">#{data.position_in_queue}</span> in line.
          </p>
          <p className="text-muted">Access opens at {formatDateTime(data.estimated_start_time)}.</p>
        </div>
      </StatusCard>
    );
  }

  return (
    <StatusCard tone="positive" icon={Check} title="Account Activated">
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{email} is in!</p>
        <p className="brightness-80">
          Access is available until {formatDateTime(data.estimated_end_time)}.
        </p>
      </div>
    </StatusCard>
  );
};

const RequestAccessPage = () => {
  const { setHasRequestedAccess } = useAuthContext();
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
    <Page width="xl" className="pt-2 pb-8">
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
          type="button"
          onClick={() => setIsEmailModalOpen(true)}
          className="text-muted text-sm w-fit text-left flex items-center gap-1.5 cursor-pointer hover:underline"
        >
          <Info className="size-3.5" /> Why do you need my email?
        </button>
      </div>

      <Divider />

      <div className="flex flex-col gap-3 text-center">
        <h2>Availability</h2>
        <AvailabilityMeter status={queueOverview.data} />
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
            <ExternalLink href="https://www.spotify.com/account/profile/" draggable={false}>
              here.
            </ExternalLink>
          </span>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            icon={CircleQuestionMark}
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
            icon={Send}
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
    </Page>
  );
};

export default RequestAccessPage;
