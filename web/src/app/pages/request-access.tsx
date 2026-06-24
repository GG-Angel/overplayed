import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Info, Key } from "lucide-react";
import { useState } from "react";

const RequestAccessPage = () => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

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
        <button className="text-muted text-sm flex items-center gap-1.5 cursor-pointer hover:underline">
          <Info className="size-4" /> Why do you need these details?
        </button>
        {isHelpModalOpen && <Modal onClose={() => setIsHelpModalOpen(false)}>Yo</Modal>}
      </div>
      <Divider />
      <form className="flex flex-col gap-6">
        <Input label="Account full name" placeholder="e.g., John Doe" />
        <Input label="Account email" placeholder="e.g., example@gmail.com" />
      </form>
    </main>
  );
};

export default RequestAccessPage;
