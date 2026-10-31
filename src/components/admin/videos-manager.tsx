import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { errorMessage } from "@/lib/format";
import { uploadVideo, useVideoUrls, validateVideo, VIDEO_BUCKET } from "@/lib/videos";

export function VideosManager() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");

  const list = useQuery({
    queryKey: ["admin", "videos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_videos").select("*").order("sort_order").order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const urls = useVideoUrls(list.data?.map((v) => v.video_path) ?? []);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "videos"] });
    qc.invalidateQueries({ queryKey: ["public", "videos"] });
  };

  const add = useMutation({
    mutationFn: async (file: File) => {
      const path = await uploadVideo(file);
      const nextOrder = (list.data?.reduce((m, v) => Math.max(m, v.sort_order), 0) ?? 0) + 1;
      const { error } = await supabase.from("site_videos").insert({ video_path: path, title: title.trim() || null, sort_order: nextOrder });
      if (error) {
        await supabase.storage.from(VIDEO_BUCKET).remove([path]);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Vídeo publicado no site");
      setTitle("");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e, "Não foi possível enviar o vídeo.")),
  });

  const update = useMutation({
    mutationFn: async (changes: { id: string; patch: { is_active?: boolean; sort_order?: number; title?: string | null } }[]) => {
      for (const c of changes) {
        const { error } = await supabase.from("site_videos").update(c.patch).eq("id", c.id);
        if (error) throw error;
      }
    },
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (v: { id: string; video_path: string }) => {
      const { error } = await supabase.from("site_videos").delete().eq("id", v.id);
      if (error) throw error;
      await supabase.storage.from(VIDEO_BUCKET).remove([v.video_path]);
    },
    onSuccess: () => {
      toast.success("Vídeo removido");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const move = (index: number, dir: -1 | 1) => {
    const items = [...(list.data ?? [])];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target]!, items[index]!];
    update.mutate(items.map((v, i) => ({ id: v.id, patch: { sort_order: i + 1 } })));
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Os vídeos passam em sequência na página inicial. Prefira vídeos em pé (formato do celular), de até 50 MB.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Legenda (opcional)" />
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const problem = validateVideo(file);
            if (problem) {
              toast.error(problem);
              return;
            }
            add.mutate(file);
          }}
        />
        <Button type="button" onClick={() => fileRef.current?.click()} disabled={add.isPending} className="shrink-0">
          {add.isPending ? <Loader2 className="animate-spin" /> : <Upload />} {add.isPending ? "Enviando…" : "Enviar vídeo"}
        </Button>
      </div>

      {list.isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface-raised" />
      ) : !list.data?.length ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum vídeo ainda. A seção de vídeos só aparece no site depois do primeiro envio.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.data.map((v, i) => (
            <li key={v.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
              {urls.data?.[v.video_path] ? (
                <video src={urls.data[v.video_path]} muted playsInline preload="metadata" className="h-20 w-12 shrink-0 rounded-md bg-surface-raised object-cover" />
              ) : (
                <div className="h-20 w-12 shrink-0 animate-pulse rounded-md bg-surface-raised" />
              )}
              <Input
                defaultValue={v.title ?? ""}
                placeholder="Sem legenda"
                maxLength={120}
                className="h-9 flex-1"
                onBlur={(e) => {
                  const t = e.target.value.trim() || null;
                  if (t !== v.title) update.mutate([{ id: v.id, patch: { title: t } }]);
                }}
              />
              <label className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <Switch checked={v.is_active} onCheckedChange={(c) => update.mutate([{ id: v.id, patch: { is_active: c } }])} /> No site
              </label>
              <div className="flex">
                <Button type="button" variant="ghost" size="icon" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Descer" disabled={i === list.data.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Excluir vídeo" onClick={() => confirm("Excluir este vídeo do site?") && remove.mutate(v)}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
