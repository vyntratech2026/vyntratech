import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/** Only published references can grant a visitor a short-lived download link. */
export const getPublishedFileUrls = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    bucket: z.enum(["media", "videos"]),
    paths: z.array(z.string().min(1).max(1024).refine((p) => !p.startsWith("/") && !p.includes("..") && !p.includes("\\") && !p.includes(":"))).max(100),
  }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const paths: string[] = [];
    for (const path of new Set(data.paths)) {
      const { data: allowed, error } = await client.rpc("is_published_site_file", { p_bucket: data.bucket, p_path: path });
      if (error) throw new Error("Não foi possível carregar os arquivos.");
      if (allowed) paths.push(path);
    }
    if (!paths.length) return {} as Record<string, string>;
    // The public database check authorizes each exact published object before privileged signing.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage.from(data.bucket).createSignedUrls(paths, 3600);
    if (error) throw new Error("Não foi possível carregar os arquivos.");
    const result: Record<string, string> = {};
    for (const file of signed ?? []) {
      if (file.path && file.signedUrl) {
        const url = new URL(file.signedUrl);
        const browserOrigin = new URL(import.meta.env.VITE_SUPABASE_URL);
        url.protocol = browserOrigin.protocol;
        url.host = browserOrigin.host;
        result[file.path] = url.toString();
      }
    }
    return result;
  });