import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { NativeSelect } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStaff } from "@/lib/use-staff";
import { addDaysKey, errorMessage, formatDate, formatTime, shopDayStartIso, todayInShop } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/bloqueios")({
  component: BlocksPage,
});

const SHOP = "__shop__";

function BlocksPage() {
  const { data: staff } = useStaff();
  const isAdmin = !!staff?.isAdmin;
  const qc = useQueryClient();
  const [day, setDay] = useState(todayInShop());
  const [wholeDay, setWholeDay] = useState(true);
  const [from, setFrom] = useState("12:00");
  const [to, setTo] = useState("13:00");
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");

  const barbers = useQuery({
    queryKey: ["admin", "barbers-lite"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("barbers").select("id, name, is_active").order("name")).data ?? [],
  });

  const blocks = useQuery({
    queryKey: ["admin", "blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_times")
        .select("id, start_at, end_at, reason, barber_id, barbers(name)")
        .gte("end_at", new Date().toISOString())
        .order("start_at");
      if (error) throw error;
      return data;
    },
  });

  const barberId = isAdmin ? (target === SHOP ? null : target) : staff?.barberId;

  const add = useMutation({
    mutationFn: async () => {
      if (isAdmin && !target) throw new Error("Escolha o barbeiro ou a barbearia toda.");
      if (!isAdmin && !staff?.barberId) throw new Error("Seu acesso não está vinculado a um barbeiro.");
      const start = wholeDay ? shopDayStartIso(day) : new Date(`${day}T${from}:00-03:00`).toISOString();
      const end = wholeDay ? shopDayStartIso(addDaysKey(day, 1)) : new Date(`${day}T${to}:00-03:00`).toISOString();
      if (new Date(end) <= new Date(start)) throw new Error("O horário final precisa ser depois do inicial.");
      const { error } = await supabase.from("blocked_times").insert({
        barber_id: barberId ?? null,
        start_at: start,
        end_at: end,
        reason: reason.trim() || null,
      });
      if (error) throw error;

      let q = supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "confirmed"])
        .lt("start_at", end)
        .gt("end_at", start);
      if (barberId) q = q.eq("barber_id", barberId);
      const { count } = await q;
      return count ?? 0;
    },
    onSuccess: (existing) => {
      toast.success("Agenda fechada. Ninguém mais consegue marcar nesse período.");
      if (existing > 0) {
        toast.warning(`Atenção: já existem ${existing} agendamento(s) nesse período. Avise os clientes ou cancele em Agendamentos.`, {
          duration: 8000,
        });
      }
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin", "blocks"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_times").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio removido. Os horários voltaram a ficar livres.");
      qc.invalidateQueries({ queryKey: ["admin", "blocks"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <>
      <PageHeader
        title={isAdmin ? "Folgas e bloqueios" : "Fechar minha agenda"}
        subtitle="Feche um dia inteiro ou só um período. Os horários somem do agendamento online."
      />

      <div className="surface-card mb-8 space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {isAdmin && (
            <div className="space-y-2">
              <Label>Para quem</Label>
              <NativeSelect value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Selecione</option>
                <option value={SHOP}>Barbearia toda (feriado, reforma…)</option>
                {barbers.data?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
          <div className="space-y-2">
            <Label>Dia</Label>
            <div className="flex gap-2">
              <Input type="date" value={day} min={todayInShop()} onChange={(e) => setDay(e.target.value)} />
              <Button type="button" variant="outline" onClick={() => setDay(todayInShop())}>
                Hoje
              </Button>
            </div>
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={wholeDay} onCheckedChange={setWholeDay} /> Dia inteiro
        </label>
        {!wholeDay && (
          <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
            <div className="space-y-2">
              <Label>De</Label>
              <Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Até</Label>
              <Input type="time" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Motivo (opcional)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} placeholder="Ex.: folga, consulta médica" />
        </div>
        <Button onClick={() => add.mutate()} disabled={add.isPending}>
          {add.isPending ? <Loader2 className="animate-spin" /> : <CalendarOff />} Fechar agenda
        </Button>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Próximos bloqueios</h2>
      {blocks.isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface" />
      ) : !blocks.data?.length ? (
        <EmptyState text="Nenhum bloqueio futuro." />
      ) : (
        <ul className="surface-card divide-y divide-border">
          {blocks.data.map((b) => {
            const canDelete = isAdmin || (b.barber_id && b.barber_id === staff?.barberId);
            const fullDay = new Date(b.end_at).getTime() - new Date(b.start_at).getTime() >= 24 * 3600 * 1000 && formatTime(b.start_at) === "00:00";
            return (
              <li key={b.id} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {formatDate(b.start_at)} · {fullDay ? "Dia inteiro" : `${formatTime(b.start_at)} – ${formatTime(b.end_at)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.barber_id ? b.barbers?.name : "Barbearia toda"}
                    {b.reason && ` · ${b.reason}`}
                  </p>
                </div>
                {canDelete && (
                  <Button variant="ghost" size="icon" aria-label="Remover bloqueio" onClick={() => remove.mutate(b.id)}>
                    <Trash2 />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
