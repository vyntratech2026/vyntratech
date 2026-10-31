import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly, PageHeader } from "@/components/admin/page-header";
import { PhotoField } from "@/components/admin/fields";
import { VideosManager } from "@/components/admin/videos-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useStaff } from "@/lib/use-staff";
import { DAY_NAMES, errorMessage } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: SettingsPage,
});

type Settings = Database["public"]["Tables"]["settings"]["Row"];
type Day = { on: boolean; open: string; close: string };

function SettingsPage() {
  const { data: staff } = useStaff();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
  const [f, setF] = useState<Settings | null>(null);
  const [days, setDays] = useState<Record<number, Day>>({});

  useEffect(() => {
    if (!q.data) return;
    setF(q.data);
    const oh = (q.data.opening_hours ?? {}) as Record<string, { open: string; close: string; closed?: boolean } | null>;
    const d: Record<number, Day> = {};
    for (let i = 0; i < 7; i++) {
      const v = oh[String(i)];
      d[i] = v && !v.closed ? { on: true, open: v.open, close: v.close } : { on: false, open: "09:00", close: "19:00" };
    }
    setDays(d);
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!f) return;
      for (const [i, d] of Object.entries(days)) {
        if (d.on && d.close <= d.open) throw new Error(`${DAY_NAMES[Number(i)]}: o fechamento precisa ser depois da abertura.`);
      }
      const opening_hours = Object.fromEntries(
        Object.entries(days).map(([i, d]) => [i, d.on ? { open: d.open, close: d.close } : { open: d.open, close: d.close, closed: true }]),
      );
      const { error } = await supabase
        .from("settings")
        .update({
          business_name: f.business_name.trim() || "Studio Cleison Cortes",
          tagline: f.tagline?.trim() || null,
          description: f.description?.trim() || null,
          cover_url: f.cover_url,
          address: f.address?.trim() || null,
          phone: f.phone?.trim() || null,
          whatsapp: f.whatsapp?.replace(/\D/g, "") || null,
          instagram: f.instagram?.trim() || null,
          maps_url: f.maps_url?.trim() || null,
          opening_hours,
          slot_interval_minutes: Number(f.slot_interval_minutes),
          min_advance_minutes: Number(f.min_advance_minutes),
          max_advance_days: Number(f.max_advance_days),
          cancellation_min_hours: Number(f.cancellation_min_hours),
          cancellation_policy: f.cancellation_policy?.trim() || null,
          notification_email: f.notification_email?.trim() || null,
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["public"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => f && setF({ ...f, [k]: v });

  return (
    <AdminOnly isAdmin={!!staff?.isAdmin}>
      <PageHeader
        title="Configurações"
        subtitle="Tudo que aparece no site e as regras da agenda online."
        actions={
          <Button onClick={() => save.mutate()} disabled={!f || save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Salvar
          </Button>
        }
      />
      {!f ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface" />
      ) : (
        <div className="space-y-8">
          <Section title="Página inicial">
            <PhotoField value={f.cover_url} onChange={(p) => set("cover_url", p)} folder="cover" className="h-20 w-32" label="Foto de capa" />
            <Field label="Nome da barbearia">
              <Input value={f.business_name} onChange={(e) => set("business_name", e.target.value)} />
            </Field>
            <Field label="Frase de apresentação">
              <Input value={f.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} maxLength={160} />
            </Field>
            <Field label="Sobre a barbearia">
              <Textarea value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={4} />
            </Field>
          </Section>

          <Section title="Vídeos do site">
            <VideosManager />
          </Section>

          <Section title="Contato">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Endereço"><Input value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
              <Field label="Telefone exibido"><Input value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="WhatsApp (com 55 + DDD)"><Input value={f.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
              <Field label="Instagram (link)"><Input value={f.instagram ?? ""} onChange={(e) => set("instagram", e.target.value)} /></Field>
              <Field label="Link do Google Maps"><Input value={f.maps_url ?? ""} onChange={(e) => set("maps_url", e.target.value)} /></Field>
              <Field label="E-mail para avisos de agendamento"><Input type="email" value={f.notification_email ?? ""} onChange={(e) => set("notification_email", e.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Horário de funcionamento">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 0].map((i) => {
                const d = days[i];
                if (!d) return null;
                const upd = (p: Partial<Day>) => setDays({ ...days, [i]: { ...d, ...p } });
                return (
                  <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                    <label className="flex w-28 items-center gap-2 text-sm">
                      <Switch checked={d.on} onCheckedChange={(v) => upd({ on: v })} /> {DAY_NAMES[i]}
                    </label>
                    {d.on ? (
                      <div className="flex items-center gap-2">
                        <Input type="time" value={d.open} onChange={(e) => upd({ open: e.target.value })} className="w-28" />
                        <span className="text-muted-foreground">às</span>
                        <Input type="time" value={d.close} onChange={(e) => upd({ close: e.target.value })} className="w-28" />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Regras da agenda online">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Intervalo entre horários (min)">
                <Input type="number" min={5} max={120} value={f.slot_interval_minutes} onChange={(e) => set("slot_interval_minutes", Number(e.target.value))} />
              </Field>
              <Field label="Antecedência mínima para agendar (min)">
                <Input type="number" min={0} value={f.min_advance_minutes} onChange={(e) => set("min_advance_minutes", Number(e.target.value))} />
              </Field>
              <Field label="Agendar até quantos dias à frente">
                <Input type="number" min={1} max={365} value={f.max_advance_days} onChange={(e) => set("max_advance_days", Number(e.target.value))} />
              </Field>
              <Field label="Cliente cancela até quantas horas antes">
                <Input type="number" min={0} max={168} value={f.cancellation_min_hours} onChange={(e) => set("cancellation_min_hours", Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Política de cancelamento (texto)">
              <Textarea value={f.cancellation_policy ?? ""} onChange={(e) => set("cancellation_policy", e.target.value)} rows={2} />
            </Field>
          </Section>
        </div>
      )}
    </AdminOnly>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card space-y-4 p-5 sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
