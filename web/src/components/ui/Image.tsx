import { cn } from "../../utils";
import { useState, type ComponentProps } from "react";

type ImageProps = ComponentProps<"img"> & {
  src: string;
  alt: string;
  className?: string;
};

const Image = ({ className, src, alt, ...props }: ImageProps) => {
  const [loaded, setLoaded] = useState<boolean>(false);

  return (
    <div className={cn("bg-faded overflow-hidden shrink-0", !loaded && "animate-pulse", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "size-full object-cover transition-opacity opacity-0",
          loaded && "opacity-100"
        )}
        {...props}
      />
    </div>
  );
};

export default Image;
