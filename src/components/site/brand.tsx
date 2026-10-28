import logoAsset from "@/assets/logo.png.asset.json";
import { useSignedUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Studio Cleison Cortes"
      width={1080}
      height={1080}
      className={cn("rounded-full", className)}
    />
  );
}

/** Image stored in the private media bucket (or an external URL). */
export function MediaImage({
  path,
  alt,
  className,
  fallbackClassName,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const url = useSignedUrl(path);
  if (!path || !url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-surface-raised text-muted-foreground",
          className,
          fallbackClassName,
        )}
        aria-label={alt}
      >
        <ImageOff className="size-6 opacity-40" />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
