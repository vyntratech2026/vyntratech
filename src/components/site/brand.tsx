import logoAsset from "@/assets/logo.png.asset.json";
import { useSignedUrl } from "@/lib/media";
import { splitBrandName, useBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

/** Shop logo: the one uploaded in "Aparência", or the original logo. */
export function Logo({ className, path }: { className?: string; path?: string | null }) {
  const brand = useBrand();
  const logoPath = path === undefined ? brand.logoPath : path;
  const signed = useSignedUrl(logoPath);
  if (logoPath && !signed) {
    return <div className={cn("rounded-full bg-surface-raised", className)} aria-label={brand.name} />;
  }
  return (
    <img
      src={logoPath ? signed : logoAsset.url}
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
