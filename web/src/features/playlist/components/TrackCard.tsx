import Card, { type CardProps } from "@/components/ui/Card";
import Image from "@/components/ui/Image";
import type { Track } from "@/lib/types";
import { cn, extractImageUrl } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

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
  const artistList = track.artists.map((t) => t.name).join(" · ");

  return (
    <Card className={cn(cardVariants({ orientation }), className)} {...props}>
      <Image
        src={coverUrl}
        className={imageVariants({ orientation })}
        alt={track.name}
        draggable={false}
      />
      <div className="text-left whitespace-nowrap truncate">
        <a
          href={track.external_urls.spotify}
          className="font-medium hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
        >
          {track.name}
        </a>
        <p className="text-muted text-sm truncate">{artistList}</p>
      </div>
    </Card>
  );
};

export default TrackCard;
