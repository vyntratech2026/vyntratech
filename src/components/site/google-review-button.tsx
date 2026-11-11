import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { googleReviewUrl } from "@/lib/google-review";

export function GoogleReviewButton({ url, className }: { url: string | null | undefined; className?: string }) {
  const href = googleReviewUrl(url);
  if (!href) return null;
  return (
    <Button asChild variant="outline" className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <ExternalLink /> Avaliar no Google
      </a>
    </Button>
  );
}