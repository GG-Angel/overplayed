import Button from "@/components/ui/buttons/Button";
import ExternalLink from "@/components/ui/ExternalLink";
import Modal, { type ModalProps } from "@/components/ui/Modal";
import { ThumbsUp } from "lucide-react";
import { useState } from "react";

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

export const EmailCollectionModal = ({ onClose }: Pick<ModalProps, "onClose">) => {
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

// keyed by the ?error= param the server redirects back with
const authErrorNotices: Record<string, Omit<NoticeModalProps, "onClose"> | undefined> = {
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
  unknown_user: {
    title: "We couldn't find that Spotify account",
    dismissLabel: "Got it.",
    children: (
      <p>
        That email doesn't belong to a Spotify account. Request access again using the exact email
        on your account, and we'll send you a fresh link.
      </p>
    ),
  },
  verification_failed: {
    title: "Something went wrong on our end",
    dismissLabel: "Got it.",
    children: (
      <p>
        We couldn't finish confirming your request. Your link has already been used up, so please
        request access again to get a fresh one.
      </p>
    ),
  },
};

export const AuthErrorModal = ({ error }: { error: string | null }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const notice = authErrorNotices[error ?? ""];

  if (!notice || isDismissed) return null;
  return <NoticeModal {...notice} onClose={() => setIsDismissed(true)} />;
};
