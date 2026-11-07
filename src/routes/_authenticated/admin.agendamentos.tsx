import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Link2, Loader2, Plus, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { NativeSelect } from "@/components/admin/fields";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStaff } from "@/lib/use-staff";
import {
  addDaysKey,
  errorMessage,
  formatDuration,
  formatLongDate,
  formatPhone,
  formatPrice,
  formatTime,
  shopDayStartIso,
  STATUS_LABELS,
  todayInShop,
  type AppointmentStatus,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/agendamentos")({
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const { data: staff } = useStaff();
  const isAdmin = !!staff?.isAdmin;
  const qc = useQueryClient();
  const [day, setDay] = useState(todayInShop());
  const [barberFilter, setBarberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const barbers = useQuery({
    queryKey: ["admin", "barbers-lite"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("barbers").select("id, name, is_active").order("name")).data ?? [],
  });

  const list = useQuery({
    queryKey: ["admin", "appointments", day, barberFilter, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("appointments")
        .select("id, start_at, duration_minutes, service_name, price, status, source, notes, manage_token, barber_id, barbers!appointments_barber_id_fkey(name), customers!appointments_customer_id_fkey(full_name, phone)")
        .gte("start_at", shopDayStartIso(day))
        .lt("start_at", shopDayStartIso(addDaysKey(day, 1)))
        .order("start_at");
      if (barberFilter) q = q.eq("barber_id", barberFilter);
      if (statusFilter) q = q.eq("status", statusFilter as AppointmentStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { error } = await supabase.rpc("update_appointment_status", { p_id: id, p_status: status });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(`Status: ${STATUS_LABELS[v.status]}`);
      qc.invalidateQueries({ queryKey: ["admin", "appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/agendamento/${token}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link do cliente copiado (cancelar/avaliar)"));
  };

  return (
    <>
      <PageHeader
        title={isAdmin ? "Agendamentos" : "Meus agendamentos"}
        subtitle={formatLongDate(`${day}T12:00:00-03:00`)}
        actions={
          isAdmin && (
            <Button onClick={() => setManualOpen(true)}>
              <Plus /> Novo agendamento
            </Button>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Dia anterior" onClick={() => setDay(addDaysKey(day, -1))}>
            <ChevronLeft />
          </Button>
          <Input type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} className="w-44" />
          <Button variant="outline" size="icon" aria-label="Próximo dia" onClick={() => setDay(addDaysKey(day, 1))}>
            <ChevronRight />
          </Button>
          <Button variant="ghost" onClick={() => setDay(todayInShop())}>
            Hoje
          </Button>
        </div>
        {isAdmin && (
          <NativeSelect value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)} className="w-48" aria-label="Filtrar por barbeiro">
            <option value="">Todos os barbeiros</option>
            {barbers.data?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </NativeSelect>
        )}
        <NativeSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-52" aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
      </div>

      {list.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : list.isError ? (
        <EmptyState text="Não foi possível carregar os agendamentos." />
      ) : !list.data?.length ? (
        <EmptyState text="Nenhum agendamento neste dia." />
      ) : (
        <ul className="space-y-3">
          {list.data.map((a) => {
            const active = a.status === "confirmed" || a.status === "pending";
            return (
              <li key={a.id} className="surface-card p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="w-16">
                    <p className="font-display text-xl font-bold text-primary">{formatTime(a.start_at)}</p>
                    <p className="text-xs text-muted-foreground">{formatDuration(a.duration_minutes)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.customers?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.service_name} · {a.barbers?.name} · {formatPrice(a.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.customers?.phone && formatPhone(a.customers.phone)} · {a.source === "admin" ? "Lançado no painel" : "Agendado online"}
                    </p>
                    {a.notes && <p className="mt-1 text-xs italic text-muted-foreground">{a.notes}</p>}
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                  {a.status === "pending" && (
                    <Button size="sm" variant="secondary" onClick={() => setStatus.mutate({ id: a.id, status: "confirmed" })}>
                      <Check /> Confirmar
                    </Button>
                  )}
                  {active && (
                    <>
                      <Button size="sm" onClick={() => setStatus.mutate({ id: a.id, status: "completed" })}>
                        <Check /> Concluir
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setStatus.mutate({ id: a.id, status: "no_show" })}>
                        <UserX /> Não compareceu
                      </Button>
                    </>
                  )}
                  {isAdmin && active && (
                    <Button size="sm" variant="outline" onClick={() => setConfirmCancel(a.id)}>
                      <X /> Cancelar
                    </Button>
                  )}
                  {isAdmin && a.status === "cancelled" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: a.id, status: "confirmed" })}>
                      Reativar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => copyLink(a.manage_token)}>
                    <Link2 /> Link do cliente
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>O horário será liberado na agenda online.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmCancel && setStatus.mutate({ id: confirmCancel, status: "cancelled" })}
            >
              Cancelar agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isAdmin && <ManualBookingDialog open={manualOpen} onOpenChange={setManualOpen} defaultDay={day} />}
    </>
  );
}

function ManualBookingDialog({ open, onOpenChange, defaultDay }: { open: boolean; onOpenChange: (o: boolean) => void; defaultDay: string }) {
  const qc = useQueryClient();
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [day, setDay] = useState(defaultDay);
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const data = useQuery({
    queryKey: ["admin", "manual-booking-data"],
    enabled: open,
    queryFn: async () => {
      const [s, b, l] = await Promise.all([
        supabase.from("services").select("id, name, price, duration_minutes").eq("is_active", true).order("name"),
        supabase.from("barbers").select("id, name").eq("is_active", true).order("name"),
        supabase.from("barber_services").select("barber_id, service_id"),
      ]);
      return { services: s.data ?? [], barbers: b.data ?? [], links: l.data ?? [] };
    },
  });
  const barbersForService = data.data?.barbers.filter((b) => data.data?.links.some((l) => l.barber_id === b.id && l.service_id === serviceId)) ?? [];

  const slots = useQuery({
    queryKey: ["slots", serviceId, barberId, day, "admin"],
    enabled: open && !!serviceId && !!barberId && !!day,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_available_slots", { p_service_id: serviceId, p_date: day, p_barber_id: barberId });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_create_booking", {
        p_service_id: serviceId,
        p_barber_id: barberId,
        p_start_at: slot,
        p_full_name: name,
        p_phone: phone,
        p_notes: notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento criado");
      qc.invalidateQueries({ queryKey: ["admin", "appointments"] });
      onOpenChange(false);
      setSlot("");
      setName("");
      setPhone("");
      setNotes("");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Serviço</Label>
            <NativeSelect value={serviceId} onChange={(e) => { setServiceId(e.target.value); setBarberId(""); setSlot(""); }}>
              <option value="">Selecione</option>
              {data.data?.services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {formatPrice(s.price)}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label>Barbeiro</Label>
            <NativeSelect value={barberId} onChange={(e) => { setBarberId(e.target.value); setSlot(""); }} disabled={!serviceId}>
              <option value="">Selecione</option>
              {barbersForService.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label>Dia</Label>
            <Input type="date" value={day} onChange={(e) => { setDay(e.target.value); setSlot(""); }} />
          </div>
          {serviceId && barberId && (
            <div className="space-y-2">
              <Label>Horário livre</Label>
              {slots.isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : !slots.data?.length ? (
                <p className="text-sm text-muted-foreground">Sem horários livres neste dia.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.data.map((s) => (
                    <button
                      key={s.slot_start}
                      type="button"
                      onClick={() => setSlot(s.slot_start)}
                      className={slot === s.slot_start ? "rounded-md border border-primary bg-primary py-2 text-sm font-semibold text-primary-foreground" : "rounded-md border border-border py-2 text-sm hover:border-primary/60"}
                    >
                      {formatTime(s.slot_start)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do cliente</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(79) 90000-0000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!slot || name.trim().length < 2 || !phone || save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="animate-spin" />} Salvar agendamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
