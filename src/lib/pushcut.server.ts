import { getRequest } from "@tanstack/react-start/server";
import { isPushcutUrl, type PushcutPayload } from "./pushcut";

export function requestOrigin(): string | null {
  try {
    return new URL(getRequest().url).origin;
  } catch {
    return null;
  }
}

export async function sendPushcut(url: string, payload: PushcutPayload): Promise<{ ok: boolean; status: number }> {
  if (!isPushcutUrl(url)) return { ok: false, status: 0 };
  const res = await fetch(url.trim(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) console.error("Pushcut error", res.status, await res.text().catch(() => ""));
  return { ok: res.ok, status: res.status };
}
