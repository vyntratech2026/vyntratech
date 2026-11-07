import { useSignedUrl } from "@/lib/media";
import { initials, splitBrandName, useBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

/** Company logo uploaded in "Aparência"; without one, the initials in the brand color. */
export function Logo({ className, path }: { className?: string; path?: string | null }) {
  const brand = useBrand();
  const logoPath = path === undefined ? brand.logoPath : path;
  const signed = useSignedUrl(logoPath);
  if (logoPath && !signed) {
    return <div className={cn("rounded-full bg-surface-raised", className)} aria-label={brand.name} />;
  }
  if (!logoPath) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-full border-2 border-primary bg-background font-display font-bold text-primary glow-primary", className)}
        aria-label={brand.name}
      >
        <span className="text-[min(1.1em,40cqw)]" style={{ fontSize: "clamp(0.7rem, 38%, 2.5rem)" }}>{initials(brand.name)}</span>
      </div>
    );
  }
  return (
    <img
      src={signed}
      alt={brand.name}
      width={1080}
      height={1080}
      className={cn("rounded-full object-cover", className)}
    />
  );
}

/** Business name with the last word in the highlight color. */
export function BrandName({ name, accentClassName }: { name?: string; accentClassName?: string }) {
  const brand = useBrand();
  const [first, last] = splitBrandName(name ?? brand.name);
  return (
    <>
      {first && `${first} `}
      <span className={cn("text-primary", accentClassName)}>{last}</span>
    </>
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
