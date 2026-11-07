import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const VIDEO_BUCKET = "videos";
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const publicVideosQuery = () =>
  queryOptions({
    queryKey: ["public", "videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_videos")
        .select("id, title, video_path, sort_order")
        .eq("is_active", true)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

/** Videos live in a private bucket; play them through short-lived signed links. */
export function useVideoUrls(paths: string[]) {
  const clean = [...new Set(paths)].sort();
  return useQuery({
    queryKey: ["video-urls", clean],
    enabled: clean.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrls(clean, 3600);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((d) => {
        if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
      });
      return map;
    },
  });
}

export function validateVideo(file: File): string | null {
  if (!VIDEO_TYPES.includes(file.type)) return "Envie um vídeo MP4, MOV ou WEBM.";
  if (file.size > VIDEO_MAX_BYTES) return "O vídeo deve ter no máximo 50 MB.";
  return null;
}

export async function uploadVideo(file: File, companyId: string): Promise<string> {
  const problem = validateVideo(file);
  if (problem) throw new Error(problem);
  const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
  const path = `${companyId}/site/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(VIDEO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    if (/exceeded|too large|maximum allowed size/i.test(error.message)) throw new Error("O vídeo é grande demais. Máximo 50 MB.");
    throw error;
  }
  return path;
}
