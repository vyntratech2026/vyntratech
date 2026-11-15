import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getPublishedFileUrls } from "./public-storage.functions";

const BUCKET = "media";
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Photos live in a private bucket; the app shows them through short-lived signed links. */
export function useSignedUrls(paths: (string | null | undefined)[]) {
  const publicUrls = useServerFn(getPublishedFileUrls);
  const clean = Array.from(new Set(paths.filter((p): p is string => !!p))).sort();
  return useQuery({
    queryKey: ["signed-urls", clean],
    enabled: clean.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const isExternal = (p: string) => /^(https?:\/\/|\/)/.test(p);
      const external = clean.filter(isExternal);
      const stored = clean.filter((p) => !isExternal(p));
      const map: Record<string, string> = {};
      external.forEach((p) => (map[p] = p));
      if (stored.length) {
        Object.assign(map, await publicUrls({ data: { bucket: BUCKET, paths: stored } }));
        const privatePaths = stored.filter((path) => !map[path]);
        if (!privatePaths.length) return map;
        const { data } = await supabase.storage.from(BUCKET).createSignedUrls(privatePaths, 3600);
        data?.forEach((d) => {
          if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
        });
      }
      return map;
    },
  });
}

export function useSignedUrl(path: string | null | undefined) {
  const q = useSignedUrls([path]);
  return path ? q.data?.[path] : undefined;
}

export function validateImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Envie uma imagem JPG, PNG ou WEBP.";
  if (file.size > MAX_BYTES) return "A imagem deve ter no máximo 5 MB.";
  return null;
}

export async function uploadImage(file: File, folder: string, companyId: string): Promise<string> {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${companyId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}
