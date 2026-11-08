import { useCompany } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { BellRing, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly, PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStaff } from "@/lib/use-staff";
import { errorMessage } from "@/lib/format";
import { isPushcutUrl } from "@/lib/pushcut";
import { sendPushcutTest } from "@/lib/notifications.functions";

export const Route = createFileRoute("/_authenticated/admin/notificacoes")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const companyId = useCompany().id;
  const { data: staff } = useStaff();
  const qc = useQueryClient();
  const testFn = useServerFn(sendPushcutTest);
  const q = useQuery({
    queryKey: ["admin", "notification-settings"],
    enabled: !!staff?.isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("pushcut_enabled, pushcut_url")
        .eq("company_id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [enabled, setEnabled] = useState(true);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (q.isSuccess) {
      setEnabled(q.data?.pushcut_enabled ?? false);
      setUrl(q.data?.pushcut_url ?? "");
    }
  }, [q.isSuccess, q.data]);

  const trimmed = url.trim();
  const urlOk = !trimmed || isPushcutUrl(trimmed);

  const save = useMutation({
    mutationFn: async () => {
      if (!urlOk) throw new Error("Link do Pushcut inválido. Ele começa com https://api.pushcut.io/");
      const { error } = await supabase
        .from("notification_settings")
        .upsert({ company_id: companyId, pushcut_enabled: enabled, pushcut_url: trimmed || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notificações salvas");
      qc.invalidateQueries({ queryKey: ["admin", "notification-settings"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const test = useMutation({
    mutationFn: () => testFn({ data: { url: trimmed } }),
    onSuccess: () => toast.success("Notificação de teste enviada. Confira seu celular."),
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <AdminOnly isAdmin={!!staff?.isAdmin}>
      <PageHeader
        title="Notificações"
        subtitle="Receba um aviso no celular sempre que um cliente agendar pelo site."
        actions={
          <Button onClick={() => save.mutate()} disabled={q.isLoading || save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Salvar
          </Button>
        }
      />
      {q.isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      ) : (
        <section className="surface-card space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <BellRing className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Pushcut</h2>
                <p className="text-sm text-muted-foreground">Aviso a cada novo agendamento feito pelo site.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Ativar avisos do Pushcut" />
              {enabled ? "Ligado" : "Desligado"}
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pushcut-url">Link da notificação (Webhook do Pushcut)</Label>
            <Input
              id="pushcut-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.pushcut.io/.../notifications/..."
              aria-invalid={!urlOk}
            />
            {!urlOk ? (
              <p className="text-xs text-destructive">O link precisa começar com https://api.pushcut.io/ e ter /notifications/ no meio.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No app Pushcut: Notifications → sua notificação → Webhook. Copie o link e cole aqui.
              </p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => test.mutate()}
            disabled={!trimmed || !urlOk || test.isPending}
          >
            {test.isPending ? <Loader2 className="animate-spin" /> : <Send />} Enviar notificação de teste
          </Button>
        </section>
      )}
    </AdminOnly>
  );
}
