import CardHeading from "@/components/ui/CardHeading";
import Divider from "@/components/ui/Divider";
import Kbd from "@/components/ui/Kbd";
import Modal from "@/components/ui/Modal";
import PillButton from "@/components/ui/PillButton";
import {
  formatShortcutKey,
  MODAL_SHORTCUTS,
  PREVIEW_SHORTCUTS,
  SWIPE_SHORTCUTS,
  type Shortcut,
} from "@/lib/shortcuts";
import { Keyboard } from "lucide-react";
import { Fragment } from "react";

const SHORTCUT_LIST: Shortcut[] = [
  ...Object.values(SWIPE_SHORTCUTS),
  ...Object.values(PREVIEW_SHORTCUTS),
  ...Object.values(MODAL_SHORTCUTS),
];

type ShortcutsHelpProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const ShortcutsHelp = ({ open, onOpen, onClose }: ShortcutsHelpProps) => {
  return (
    <>
      <PillButton
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        icon={<Keyboard className="size-3.5 shrink-0" />}
        className="hidden md:inline-flex"
      >
        Shortcuts
      </PillButton>
      {open && (
        <Modal onClose={onClose} className="flex flex-col gap-4 max-w-md">
          <CardHeading icon={Keyboard}>Keyboard Shortcuts</CardHeading>
          <Divider />
          <dl className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2">
            {SHORTCUT_LIST.map(({ keys, label }) => (
              <Fragment key={label}>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="flex items-center justify-end gap-1">
                  {keys.map((key, index) => (
                    <Fragment key={key}>
                      {index > 0 && (
                        <span aria-hidden="true" className="text-xs text-faded">
                          /
                        </span>
                      )}
                      <Kbd>{formatShortcutKey(key)}</Kbd>
                    </Fragment>
                  ))}
                </dd>
              </Fragment>
            ))}
          </dl>
        </Modal>
      )}
    </>
  );
};

export default ShortcutsHelp;
