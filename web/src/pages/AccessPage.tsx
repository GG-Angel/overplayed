import Button from "@/components/ui/buttons/Button";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";
import Turnstile, { type TurnstileHandle } from "@/features/session/auth/Turnstile";
import { CircleQuestionMark, Info, Key, Send } from "lucide-react";
import { useRef, useState, type SubmitEventHandler } from "react";
import { loadFromStorage, saveToStorage, storageKeys } from "@/lib/storage";
import AvailabilityMeter from "@/features/session/components/AvailabilityMeter";
import ExternalLink from "@/components/ui/ExternalLink";
import Page from "@/components/layout/Page";
import { Spinner } from "@/components/ui/Spinner";
import { useSearchParams } from "react-router-dom";
import { accessRequestFormSchema, type AccessRequestForm } from "@/types/queue";
import { useAccessStatus, useQueueStatus, useRefreshAccessStatus } from "@/api/queries";
import { useRequestAccess } from "@/api/mutations";
import { useAuthContext } from "@/features/session/auth/AuthContext";
import Card from "@/components/ui/cards/Card";
import StatusCard from "@/components/ui/cards/StatusCard";
import AccessStatusCard from "@/features/session/components/AccessStatusCard";
import { AuthErrorModal, EmailCollectionModal } from "@/features/session/components/AccessNotices";
import { getErrorDetail } from "@/api/api-client";

const ErrorNotice = ({ message }: { message: string }) => {
  return (
    <Card tone="negative" padding="lg" radius="lg" className="flex flex-col gap-2 py-4">
      {message}
    </Card>
  );
};

const RequestAccessPage = () => {
  const { setHasRequestedAccess } = useAuthContext();
  const queueOverview = useQueueStatus();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState<AccessRequestForm>(() => {
    const email = searchParams.get("email");
    if (email) return { email };
    return loadFromStorage(localStorage, storageKeys.accessForm, { email: "" });
  });
  const [errors, setErrors] = useState<Partial<AccessRequestForm>>({});
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [checkedEmail, setCheckedEmail] = useState<string>(() => form.email);

  const turnstileRef = useRef<TurnstileHandle>(null);
  const requestAccess = useRequestAccess();
  const accessStatus = useAccessStatus(checkedEmail);
  const refreshAccessStatus = useRefreshAccessStatus();

  const validateForm = (): AccessRequestForm | null => {
    const result = accessRequestFormSchema.safeParse(form);
    setErrors(
      result.success
        ? {}
        : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]))
    );
    return result.success ? result.data : null;
  };

  const handleCheckStatus = () => {
    const validated = validateForm();
    if (!validated) return;

    requestAccess.reset();
    refreshAccessStatus(validated.email);
    setCheckedEmail(validated.email);
  };

  const handleSubmitRequest: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const validated = validateForm();
    if (!validated || !turnstileToken) return;

    requestAccess.mutate(
      { form: validated, turnstileToken },
      {
        onSettled: () => {
          setTurnstileToken("");
          turnstileRef.current?.reset();
        },
        onSuccess: () => {
          saveToStorage(localStorage, storageKeys.accessForm, validated);
          setHasRequestedAccess(true);
          setCheckedEmail(validated.email);
        },
      }
    );
  };

  const accessRequestResult = (() => {
    if (requestAccess.isPending)
      return { kind: "pending", message: "Sending your request..." } as const;
    if (accessStatus.isFetching)
      return { kind: "pending", message: "Checking your status..." } as const;

    if (requestAccess.isError) {
      const detail = getErrorDetail(requestAccess.error);
      return {
        kind: "error",
        message: detail ?? `Failed to send your request for ${checkedEmail}. Please try again.`,
      } as const;
    }
    if (accessStatus.isError) {
      return { kind: "error", message: `Failed to load the status for ${checkedEmail}.` } as const;
    }

    if (accessStatus.data) return { kind: "status", status: accessStatus.data } as const;
    if (accessStatus.isSuccess) return { kind: "unregistered" } as const;
    return null;
  })();

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
            disabled={requestAccess.isPending}
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
            disabled={requestAccess.isPending || !form.email}
            onClick={handleCheckStatus}
          >
            Check Status
          </Button>
          <Button
            icon={Send}
            className="sm:flex-1"
            type="submit"
            size="lg"
            disabled={requestAccess.isPending || !turnstileToken || !form.email}
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

      {accessRequestResult && <Divider />}

      {accessRequestResult?.kind === "pending" && (
        <div className="flex flex-col items-center gap-2 text-muted">
          <Spinner />
          <p className="text-sm">{accessRequestResult.message}</p>
        </div>
      )}

      {accessRequestResult?.kind === "error" && (
        <ErrorNotice message={accessRequestResult.message} />
      )}

      {accessRequestResult?.kind === "status" && (
        <AccessStatusCard
          status={accessRequestResult.status}
          isFreshRequest={requestAccess.isSuccess}
        />
      )}

      {accessRequestResult?.kind === "unregistered" && (
        <StatusCard tone="muted" icon={CircleQuestionMark} title="No Request Found">
          <p>
            We have no record of a request for <span className="text-accent">{checkedEmail}</span>.
          </p>
          <p className="text-muted text-sm">
            Send a request above and we'll email you a link to confirm it.
          </p>
        </StatusCard>
      )}

      {isEmailModalOpen && <EmailCollectionModal onClose={() => setIsEmailModalOpen(false)} />}
      <AuthErrorModal error={searchParams.get("error")} />
    </Page>
  );
};

export default RequestAccessPage;
