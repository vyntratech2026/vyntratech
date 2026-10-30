import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { KeyRound, Loader2, Pencil, Plus, ShieldCheck, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly, EmptyState, PageHeader } from "@/components/admin/page-header";
import { PhotoField } from "@/components/admin/fields";
import { MediaImage } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStaff } from "@/lib/use-staff";
import { DAY_NAMES, errorMessage, formatPhone } from "@/lib/format";
import { createBarberAccess, resetBarberPassword, revokeBarberAccess } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/admin/barbeiros")({
  component: BarbersPage,
});

type Hours = Record<number, { on: boolean; start: string; end: string }>;

interface BarberForm {
  id?: string;
  user_id?: string | null;
  name: string;
  photo_url: string | null;
  description: string;
  specialties: string;
  phone: string;
  commission_percent: string;
  is_active: boolean;
  services: string[];
  hours: Hours;
}

const defaultHours = (): Hours =>
  Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, { on: false, start: "09:00", end: "18:00" }])) as Hours;

const EMPTY = (): BarberForm => ({
  name: "",
  photo_url: null,
  description: "",
  specialties: "",
  phone: "",
  commission_percent: "0",
  is_active: true,
  services: [],
  hours: defaultHours(),
});

function BarbersPage() {
  const { data: staff } = useStaff();
  const qc = useQueryClient();
  const [form, setForm] = useState<BarberForm | null>(null);

  const data = useQuery({
    queryKey: ["admin", "barbers"],
    queryFn: async () => {
      const [b, s, l, h] = await Promise.all([
        supabase.from("barbers").select("*").order("name"),
        supabase.from("services").select("id, name, is_active").order("name"),
        supabase.from("barber_services").select("barber_id, service_id"),
        supabase.from("working_hours").select("*"),
      ]);
      if (b.error) throw b.error;
      return { barbers: b.data, services: s.data ?? [], links: l.data ?? [], hours: h.data ?? [] };
    },
  });

  const openEdit = (id?: string) => {
    if (!id) return setForm(EMPTY());
    const b = data.data?.barbers.find((x) => x.id === id);
    if (!b) return;
    const hours = defaultHours();
    data.data?.hours
      .filter((h) => h.barber_id === id && h.is_active)
      .forEach((h) => (hours[h.day_of_week] = { on: true, start: h.start_time.slice(0, 5), end: h.end_time.slice(0, 5) }));
    setForm({
      id: b.id,
      user_id: b.user_id,
      name: b.name,
      photo_url: b.photo_url,
      description: b.description ?? "",
      specialties: (b.specialties ?? []).join(", "),
      phone: b.phone ? formatPhone(b.phone) : "",
      commission_percent: String(b.commission_percent),
      is_active: b.is_active,
      services: data.data?.links.filter((l) => l.barber_id === id).map((l) => l.service_id) ?? [],
      hours,
    });
  };

  const save = useMutation({
    mutationFn: async (f: BarberForm) => {
      const commission = Number(f.commission_percent.replace(",", "."));
      if (f.name.trim().length < 2) throw new Error("Informe o nome.");
      if (!Number.isFinite(commission) || commission < 0 || commission > 100) throw new Error("Comissão deve ser entre 0 e 100%.");
      for (const [d, h] of Object.entries(f.hours)) {
        if (h.on && h.end <= h.start) throw new Error(`${DAY_NAMES[Number(d)]}: o horário final precisa ser depois do inicial.`);
      }
      const row = {
        name: f.name.trim(),
        photo_url: f.photo_url,
        description: f.description.trim() || null,
        specialties: f.specialties.split(",").map((s) => s.trim()).filter(Boolean),
        phone: f.phone.replace(/\D/g, "") || null,
        commission_percent: commission,
        is_active: f.is_active,
      };
      let id = f.id;
      if (id) {
        const { error } = await supabase.from("barbers").update(row).eq("id", id);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase.from("barbers").insert(row).select("id").single();
        if (error) throw error;
        id = created.id;
      }
      await supabase.from("barber_services").delete().eq("barber_id", id);
      if (f.services.length) {
        const { error } = await supabase.from("barber_services").insert(f.services.map((service_id) => ({ barber_id: id!, service_id })));
        if (error) throw error;
      }
      await supabase.from("working_hours").delete().eq("barber_id", id);
      const hours = Object.entries(f.hours)
        .filter(([, h]) => h.on)
        .map(([d, h]) => ({ barber_id: id!, day_of_week: Number(d), start_time: h.start, end_time: h.end, is_active: true }));
      if (hours.length) {
        const { error } = await supabase.from("working_hours").insert(hours);
        if (error) throw error;
      }
      return id;
    },
    onSuccess: () => {
      toast.success("Barbeiro salvo");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["public"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <AdminOnly isAdmin={!!staff?.isAdmin}>
      <PageHeader
        title="Barbeiros"
        subtitle="Cadastro, serviços, horários de trabalho, comissão e acesso ao painel."
        actions={
          <Button onClick={() => openEdit()}>
            <Plus /> Novo barbeiro
          </Button>
        }
      />
      {data.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : !data.data?.barbers.length ? (
        <EmptyState text="Nenhum barbeiro cadastrado ainda." action={<Button onClick={() => openEdit()}>Cadastrar primeiro barbeiro</Button>} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.data.barbers.map((b) => {
            const nServices = data.data!.links.filter((l) => l.barber_id === b.id).length;
            const nDays = data.data!.hours.filter((h) => h.barber_id === b.id && h.is_active).length;
            return (
              <li key={b.id} className="surface-card flex items-center gap-4 p-4">
                <MediaImage path={b.photo_url} alt={b.name} className="size-16 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {b.name} {!b.is_active && <span className="text-xs font-normal text-muted-foreground">(inativo)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nServices} serviço(s) · {nDays} dia(s) de trabalho · comissão {Number(b.commission_percent)}%
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs">
                    {b.user_id ? (
                      <span className="flex items-center gap-1 text-primary"><ShieldCheck className="size-3" /> Tem acesso ao painel</span>
                    ) : (
                      <span className="text-muted-foreground">Sem acesso ao painel</span>
                    )}
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(b.id)}>
                  <Pencil />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? `Editar ${form.name}` : "Novo barbeiro"}</DialogTitle>
          </DialogHeader>
          {form && (
            <Tabs defaultValue="perfil">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="perfil">Perfil</TabsTrigger>
                <TabsTrigger value="servicos">Serviços</TabsTrigger>
                <TabsTrigger value="horarios">Horários</TabsTrigger>
                <TabsTrigger value="acesso" disabled={!form.id}>Acesso</TabsTrigger>
              </TabsList>

              <TabsContent value="perfil" className="space-y-4 pt-4">
                <PhotoField value={form.photo_url} onChange={(p) => setForm({ ...form, photo_url: p })} folder="barbers" className="rounded-full" />
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Especialidades (separe por vírgula)</Label>
                  <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Degradê, Barba" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição profissional</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Comissão por corte (%)</Label>
                    <Input inputMode="decimal" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">A comissão vale só para serviços. Venda de produto fica 100% com a barbearia.</p>
                <label className="flex items-center gap-3 text-sm">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> Ativo (recebe agendamentos)
                </label>
              </TabsContent>

              <TabsContent value="servicos" className="space-y-2 pt-4">
                {!data.data?.services.length ? (
                  <p className="text-sm text-muted-foreground">Cadastre serviços primeiro.</p>
                ) : (
                  data.data.services.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
                      <Checkbox
                        checked={form.services.includes(s.id)}
                        onCheckedChange={(c) =>
                          setForm({ ...form, services: c ? [...form.services, s.id] : form.services.filter((x) => x !== s.id) })
                        }
                      />
                      {s.name} {!s.is_active && <span className="text-xs text-muted-foreground">(inativo)</span>}
                    </label>
                  ))
                )}
              </TabsContent>

              <TabsContent value="horarios" className="space-y-2 pt-4">
                <p className="text-xs text-muted-foreground">Os horários também respeitam o funcionamento da barbearia (Configurações).</p>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = form.hours[d] ?? { on: false, start: "09:00", end: "18:00" };
                  const set = (patch: Partial<Hours[number]>) =>
                    setForm({ ...form, hours: { ...form.hours, [d]: { ...h, ...patch } as Hours[number] } });
                  return (
                    <div key={d} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                      <label className="flex w-28 items-center gap-2 text-sm">
                        <Switch checked={h.on} onCheckedChange={(v) => set({ on: v })} /> {DAY_NAMES[d]}
                      </label>
                      {h.on ? (
                        <div className="flex items-center gap-2">
                          <Input type="time" value={h.start} onChange={(e) => set({ start: e.target.value })} className="w-28" />
                          <span className="text-muted-foreground">às</span>
                          <Input type="time" value={h.end} onChange={(e) => set({ end: e.target.value })} className="w-28" />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Folga</span>
                      )}
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="acesso" className="pt-4">
                {form.id && <AccessPanel barberId={form.id} hasAccess={!!form.user_id} onChanged={(has) => setForm({ ...form, user_id: has ? "x" : null })} />}
              </TabsContent>

              <Button className="mt-6 w-full" disabled={save.isPending} onClick={() => save.mutate(form)}>
                {save.isPending && <Loader2 className="animate-spin" />} Salvar barbeiro
              </Button>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </AdminOnly>
  );
}

function AccessPanel({ barberId, hasAccess, onChanged }: { barberId: string; hasAccess: boolean; onChanged: (has: boolean) => void }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createBarberAccess);
  const resetFn = useServerFn(resetBarberPassword);
  const revokeFn = useServerFn(revokeBarberAccess);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const run = useMutation({
    mutationFn: async (action: "create" | "reset" | "revoke") => {
      if (action === "create") await createFn({ data: { barberId, phone, password } });
      if (action === "reset") await resetFn({ data: { barberId, password } });
      if (action === "revoke") await revokeFn({ data: { barberId } });
      return action;
    },
    onSuccess: (action) => {
      toast.success(action === "create" ? "Acesso criado. Envie o celular e a senha ao barbeiro." : action === "reset" ? "Senha trocada" : "Acesso removido");
      setPassword("");
      onChanged(action !== "revoke");
      qc.invalidateQueries({ queryKey: ["admin", "barbers"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Crie o login do barbeiro. Ele entra na Área da equipe com o celular e a senha.</p>
        <div className="space-y-2">
          <Label>Celular de login</Label>
          <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(79) 90000-0000" />
        </div>
        <div className="space-y-2">
          <Label>Senha inicial (mín. 8 caracteres)</Label>
          <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button variant="secondary" disabled={run.isPending || password.length < 8 || !phone} onClick={() => run.mutate("create")}>
          {run.isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Criar acesso
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <p className="flex items-center gap-2 text-sm text-primary"><ShieldCheck className="size-4" /> Este barbeiro já tem acesso ao painel.</p>
      <div className="space-y-2">
        <Label>Nova senha</Label>
        <div className="flex gap-2">
          <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mín. 8 caracteres" />
          <Button variant="secondary" disabled={run.isPending || password.length < 8} onClick={() => run.mutate("reset")}>
            <KeyRound /> Trocar
          </Button>
        </div>
      </div>
      <Button variant="outline" disabled={run.isPending} onClick={() => confirm("Remover o acesso deste barbeiro ao painel?") && run.mutate("revoke")}>
        <UserMinus /> Remover acesso
      </Button>
    </div>
  );
}
