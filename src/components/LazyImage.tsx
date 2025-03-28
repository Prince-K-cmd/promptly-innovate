
import React, { useState } from "react";
import { useIntersectionObserver } from "@/lib/performance";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  aspectRatio?: "square" | "video" | "wide" | "auto";
}

const LazyImage = ({
  src,
  alt,
  className,
  fallback = "/placeholder.svg",
  aspectRatio = "auto",
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>();

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[21/9]",
    auto: "",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden bg-muted",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {isIntersecting && (
        <img
          src={error ? fallback : src}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
