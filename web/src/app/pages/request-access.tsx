import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Info, Key, ThumbsUp } from "lucide-react";
import { useState } from "react";

const RequestAccessPage = () => {
  const [isModalActive, setIsModalActive] = useState<boolean>(false);

  return (
    <main className="flex flex-col gap-6 max-w-xl py-2">
      <div className="flex flex-col gap-3">
        <h1 className="flex items-center gap-4">
          Request Access <Key className="text-accent size-10" />
        </h1>
        <p>
          Spotify caps the number of users a third-party app like this can serve at once, so access
          is granted in turns.
        </p>
        <p>Join the queue and we'll let you in as soon as a spot frees up!</p>
        <button
          onClick={() => setIsModalActive(true)}
          className="text-muted text-sm flex items-center gap-1.5 cursor-pointer hover:underline"
        >
          <Info className="size-4" /> Why do you need these details?
        </button>
        {isModalActive && (
          <Modal onClose={() => setIsModalActive(false)} className="flex flex-col gap-3">
            <h2>Why we need these details</h2>
            <p>
              Spotify only lets a few approved accounts use this small app at a time. When your turn
              comes, you're added to the allowlist automatically.
            </p>
            <p>
              For that to work, your name and email must match your Spotify account exactly. A
              mismatch means login will fail, so be precise.
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
              These details are used <span className="font-bold">only</span> to grant access.
              Nothing else.
            </p>
            <Button
              icon={<ThumbsUp className="size-4" />}
              variant="secondary"
              onClick={() => setIsModalActive(false)}
            >
              Understood.
            </Button>
          </Modal>
        )}
      </div>
      <Divider />
      <form className="flex flex-col gap-6">
        <Input
          label="Account full name"
          hint="Note: This is not your username."
          placeholder="e.g., John Doe"
        />
        <Input label="Account email" placeholder="e.g., example@gmail.com" />
      </form>
      <div></div>
    </main>
  );
};

export default RequestAccessPage;
