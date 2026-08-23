import Image from "@/components/ui/Image";
import ExternalLink from "@/components/ui/ExternalLink";
import { cn, extractImageUrl } from "@/lib/utils";
import type { Track } from "@/types/spotify";
import { cva, type VariantProps } from "class-variance-authority";
import Card, { type CardProps } from "../ui/cards/Card";

const cardVariants = cva("flex gap-3 shrink-0", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "items-center py-3",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

const imageVariants = cva("aspect-square object-cover rounded-sm select-none", {
  variants: {
    orientation: {
      vertical: "w-full",
      horizontal: "size-12",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

type TrackCardProps = CardProps &
  VariantProps<typeof cardVariants> & {
    track: Track;
  };

const TrackCard = ({ track, orientation, className, ...props }: TrackCardProps) => {
  const coverUrl = extractImageUrl(track.album.images, orientation === "horizontal" ? "sm" : "lg");

  return (
    <Card className={cn(cardVariants({ orientation }), className)} tabIndex={-1} {...props}>
      <Image
        src={coverUrl}
        className={imageVariants({ orientation })}
        alt={track.name}
        draggable={false}
      />
      <div className="text-left whitespace-nowrap truncate">
        <ExternalLink href={track.external_urls.spotify} className="font-medium" draggable={false}>
          {track.name}
        </ExternalLink>
        <p className="text-muted text-sm truncate">
          {track.artists.map((a, index) => (
            <span key={a.id}>
              {index > 0 && " · "}
              <ExternalLink href={a.external_urls.spotify}>{a.name}</ExternalLink>
            </span>
          ))}
        </p>
      </div>
    </Card>
  );
};

export default TrackCard;
