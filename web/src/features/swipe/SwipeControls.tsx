import { Fragment } from "react";
import { Heart, Keyboard, X } from "lucide-react";
import Divider from "../../components/ui/Divider";
import Kbd from "../../components/ui/Kbd";
import Modal from "../../components/ui/Modal";
import { PillButton } from "../../components/ui/Button";
import {
  formatShortcutKey,
  MODAL_SHORTCUTS,
  PREVIEW_SHORTCUTS,
  SWIPE_SHORTCUTS,
  type Shortcut,
} from "../../shortcuts";
import { cn } from "../../utils";

export const SwipeProgress = ({
  likes,
  dislikes,
  total,
  className,
}: {
  likes: number;
  dislikes: number;
  total: number;
  className?: string;
}) => {
  const toPercent = (value: number) => (total > 0 ? (value / total) * 100 : 0);
  const remaining = Math.max(total - likes - dislikes, 0);
  const segments = [
    { key: "dislikes", width: toPercent(dislikes), className: "bg-destructive" },
    {
      key: "likes",
      width: toPercent(likes),
      className: "bg-primary",
      style: { marginLeft: dislikes > 0 ? "2px" : "0" },
    },
  ];
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2">
        <p className="text-destructive min-w-12 text-right text-sm">{dislikes}</p>
        <X className="text-destructive shrink-0" />
        <div
          className="flex mx-2 h-1 w-full overflow-hidden rounded-full bg-card"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={likes + dislikes}
          aria-label="Swipe progress"
        >
          {segments.map(({ key, width, style, className: segmentClassName }) => (
            <div
              key={key}
              className={`h-full rounded transition-all duration-300 ${segmentClassName}`}
              style={{ width: `${width}%`, ...style }}
            />
          ))}
        </div>
        <Heart className="size-4.75 text-primary shrink-0" />
        <p className="text-primary min-w-12 text-left text-sm">{likes}</p>
      </div>
      <p className="text-center text-sm text-muted">{remaining} left</p>
    </div>
  );
};

const SHORTCUT_LIST: Shortcut[] = [
  ...Object.values(SWIPE_SHORTCUTS),
  ...Object.values(PREVIEW_SHORTCUTS),
  ...Object.values(MODAL_SHORTCUTS),
];

export const ShortcutsHelp = ({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) => (
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
        <h2 className="flex items-center gap-2">
          <Keyboard className="shrink-0" /> Keyboard Shortcuts
        </h2>
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
