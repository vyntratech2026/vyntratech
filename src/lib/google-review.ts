export function googleReviewUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const googleHost = host === "g.page" || host === "maps.app.goo.gl" ||
      host === "google.com" || host.endsWith(".google.com") ||
      host === "google.com.br" || host.endsWith(".google.com.br");
    return url.protocol === "https:" && googleHost && !url.username && !url.password && !url.port
      ? trimmed : null;
  } catch {
    return null;
  }
}

export function bookingGoogleReviewUrl(status: string, value: string | null | undefined): string | null {
  return status === "completed" ? googleReviewUrl(value) : null;
}