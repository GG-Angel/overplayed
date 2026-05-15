import type { Track } from "@/lib/types";
import Card from "./ui/Card";
import { cn, extractImageUrl } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva("flex gap-3 select-none", {
  variants: {
    orientation: {
      vertical: "flex-col w-64 sm:w-72 lg:w-84",
      horizontal: "items-center",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

const imageVariants = cva("aspect-square object-cover rounded-sm", {
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

type TrackCardProps = VariantProps<typeof cardVariants> & {
  track: Track;
  className?: string;
};

const TrackCard = ({ track, orientation, className }: TrackCardProps) => {
  const coverUrl = extractImageUrl(track.album.images, "lg");
  const artistList = track.artists.map((t) => t.name).join(", ");
  const padding = orientation === "horizontal" ? "wide" : "square";

  return (
    <Card padding={padding} className={cn(cardVariants({ orientation }), className)}>
      <img
        src={coverUrl}
        className={imageVariants({ orientation })}
        alt={`${track.name} cover`}
        draggable={false}
      />
      <div className="text-left whitespace-nowrap truncate">
        <a
          href={track.external_urls.spotify}
          className="font-medium hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {track.name}
        </a>
        <p className="text-muted-foreground text-sm truncate">{artistList}</p>
      </div>
    </Card>
  );
};

export default TrackCard;
