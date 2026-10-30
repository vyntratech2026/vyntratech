import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly, EmptyState, PageHeader } from "@/components/admin/page-header";
import { NativeSelect, StatCard } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStaff } from "@/lib/use-staff";
import { addDaysKey, errorMessage, formatDate, formatPrice, shopDayStartIso, toShopDateKey, todayInShop } from "@/lib/format";
import { commissionFor, PAYMENT_METHODS, sumBy } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  component: FinancePage,
});

type Period = "today" | "7d" | "30d" | "month" | "last_month" | "custom";

function periodRange(p: Period, from: string, to: string): { start: string; end: string } {
  const today = todayInShop();
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  switch (p) {
    case "today":
      return { start: today, end: addDaysKey(today, 1) };
    case "7d":
      return { start: addDaysKey(today, -6), end: addDaysKey(today, 1) };
    case "30d":
      return { start: addDaysKey(today, -29), end: addDaysKey(today, 1) };
    case "month": {
      const next = addDaysKey(firstOfMonth, 32).slice(0, 7) + "-01";
      return { start: firstOfMonth, end: next };
    }
    case "last_month": {
      const prev = addDaysKey(firstOfMonth, -1).slice(0, 7) + "-01";
      return { start: prev, end: firstOfMonth };
    }
    case "custom":
      return { start: from, end: addDaysKey(to, 1) };
  }
}

function FinancePage() {
  const { data: staff } = useStaff();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState(addDaysKey(todayInShop(), -7));
  const [to, setTo] = useState(todayInShop());
  const [dialog, setDialog] = useState<null | { appointmentId?: string | undefined }>(null);
  const range = periodRange(period, from, to);

  const q = useQuery({
    queryKey: ["admin", "finance", range.start, range.end],
    queryFn: async () => {
      const start = shopDayStartIso(range.start);
      const end = shopDayStartIso(range.end);
      const [pay, barbers, completed] = await Promise.all([
        supabase
          .from("payments")
          .select("id, amount, kind, payment_method, payment_date, barber_id, notes, appointment_id, appointments(service_name), products(name), customers(full_name)")
          .gte("payment_date", start)
          .lt("payment_date", end)
          .order("payment_date", { ascending: false }),
        supabase.from("barbers").select("id, name, commission_percent").order("name"),
        supabase
          .from("appointments")
          .select("id, start_at, service_name, price, customers(full_name), barbers(name), payments(id)")
          .eq("status", "completed")
          .gte("start_at", start)
          .lt("start_at", end)
          .order("start_at", { ascending: false }),
      ]);
      if (pay.error) throw pay.error;
      return { payments: pay.data, barbers: barbers.data ?? [], completed: completed.data ?? [] };
    },
  });

  const d = q.data;
  const stats = useMemo(() => {
    if (!d) return null;
    const p = d.payments;
    const byDay = new Map<string, number>();
    const byService = new Map<string, number>();
    const byMethod = new Map<string, number>();
    p.forEach((x) => {
      const k = toShopDateKey(x.payment_date);
      byDay.set(k, (byDay.get(k) ?? 0) + Number(x.amount));
      const label = x.kind === "product" ? `Produto: ${x.products?.name ?? "—"}` : (x.appointments?.service_name ?? "Serviço avulso");
      byService.set(label, (byService.get(label) ?? 0) + Number(x.amount));
      byMethod.set(x.payment_method, (byMethod.get(x.payment_method) ?? 0) + Number(x.amount));
    });
    const days: { day: string; total: number }[] = [];
    for (let k = range.start; k < range.end && days.length < 62; k = addDaysKey(k, 1)) {
      days.push({ day: k.slice(8) + "/" + k.slice(5, 7), total: byDay.get(k) ?? 0 });
    }
    return {
      total: sumBy(p),
      services: sumBy(p, "service"),
      products: sumBy(p, "product"),
      count: p.length,
      days,
      byService: [...byService.entries()].sort((a, b) => b[1] - a[1]),
      byMethod: [...byMethod.entries()].sort((a, b) => b[1] - a[1]),
      barbers: d.barbers.map((b) => ({
        ...b,
        revenue: sumBy(p.filter((x) => x.barber_id === b.id), "service"),
        commission: commissionFor(p, b.id, Number(b.commission_percent)),
      })),
      unpaid: d.completed.filter((a) => !a.payments?.length),
    };
  }, [d, range.start, range.end]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pagamento excluído");
      qc.invalidateQueries({ queryKey: ["admin", "finance"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <AdminOnly isAdmin={!!staff?.isAdmin}>
      <PageHeader
        title="Financeiro"
        subtitle="Faturamento conta só pagamentos registrados. Comissão: só sobre cortes."
        actions={
          <Button onClick={() => setDialog({})}>
            <Plus /> Registrar pagamento
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <NativeSelect value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="w-48" aria-label="Período">
          <option value="today">Hoje</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="month">Este mês</option>
          <option value="last_month">Mês anterior</option>
          <option value="custom">Período personalizado</option>
        </NativeSelect>
        {period === "custom" && (
          <>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" aria-label="De" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" aria-label="Até" />
          </>
        )}
      </div>

      {!stats ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Faturamento" value={formatPrice(stats.total)} accent />
            <StatCard label="Serviços" value={formatPrice(stats.services)} />
            <StatCard label="Produtos" value={formatPrice(stats.products)} hint="100% da barbearia" />
            <StatCard label="Pagamentos" value={stats.count} />
          </div>

          <section className="surface-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Faturamento por dia</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.days}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} width={50} />
                  <Tooltip
                    cursor={{ fill: "var(--secondary)" }}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                    formatter={(v: number) => formatPrice(v)}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Barbeiros</h2>
            <div className="surface-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="p-3">Barbeiro</th>
                    <th className="p-3 text-right">Cortes pagos</th>
                    <th className="p-3 text-right">Comissão %</th>
                    <th className="p-3 text-right">A pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.barbers.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0">
                      <td className="p-3 font-medium">{b.name}</td>
                      <td className="p-3 text-right">{formatPrice(b.revenue)}</td>
                      <td className="p-3 text-right">{Number(b.commission_percent)}%</td>
                      <td className="p-3 text-right font-semibold text-primary">{formatPrice(b.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <Breakdown title="Por serviço / produto" rows={stats.byService} />
            <Breakdown title="Por forma de pagamento" rows={stats.byMethod.map(([k, v]) => [PAYMENT_METHODS[k as keyof typeof PAYMENT_METHODS] ?? k, v])} />
          </div>

          {stats.unpaid.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Concluídos sem pagamento registrado</h2>
              <ul className="surface-card divide-y divide-border">
                {stats.unpaid.map((a) => (
                  <li key={a.id} className="flex items-center gap-4 p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.customers?.full_name} · {a.service_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(a.start_at)} · {a.barbers?.name} · {formatPrice(a.price)}</p>
                    </div>
                    <Button size="sm" onClick={() => setDialog({ appointmentId: a.id })}>Registrar</Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-semibold">Pagamentos</h2>
            {!d?.payments.length ? (
              <EmptyState text="Nenhum pagamento neste período." />
            ) : (
              <ul className="surface-card divide-y divide-border">
                {d.payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {p.kind === "product" ? `Produto: ${p.products?.name ?? "—"}` : (p.appointments?.service_name ?? "Serviço")}
                        {p.customers?.full_name && ` · ${p.customers.full_name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.payment_date)} · {PAYMENT_METHODS[p.payment_method]}
                        {p.notes && ` · ${p.notes}`}
                      </p>
                    </div>
                    <span className="font-semibold">{formatPrice(p.amount)}</span>
                    <Button variant="ghost" size="icon" aria-label="Excluir pagamento" onClick={() => confirm("Excluir este pagamento?") && remove.mutate(p.id)}>
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {dialog && (
        <PaymentDialog
          appointmentId={dialog.appointmentId}
          onClose={() => setDialog(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "finance"] })}
        />
      )}
    </AdminOnly>
  );
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="surface-card p-5">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {!rows.length ? (
        <p className="text-sm text-muted-foreground">Sem dados.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-3">
              <span className="truncate text-muted-foreground">{k}</span>
              <span className="font-medium">{formatPrice(v)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PaymentDialog({ appointmentId, onClose, onSaved }: { appointmentId?: string | undefined; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<"service" | "product">("service");
  const [apptId, setApptId] = useState(appointmentId ?? "");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<keyof typeof PAYMENT_METHODS>("pix");
  const [date, setDate] = useState(todayInShop());
  const [notes, setNotes] = useState("");

  const opts = useQuery({
    queryKey: ["admin", "payment-options"],
    queryFn: async () => {
      const since = shopDayStartIso(addDaysKey(todayInShop(), -60));
      const [a, p] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, start_at, service_name, price, customer_id, barber_id, customers(full_name), barbers(name), payments(id)")
          .eq("status", "completed")
          .gte("start_at", since)
          .order("start_at", { ascending: false }),
        supabase.from("products").select("id, name, price").order("name"),
      ]);
      return { appts: (a.data ?? []).filter((x) => !x.payments?.length), products: p.data ?? [] };
    },
  });
  const appt = opts.data?.appts.find((a) => a.id === apptId);
  const product = opts.data?.products.find((p) => p.id === productId);

  const save = useMutation({
    mutationFn: async () => {
      const value = Number((amount || String(kind === "service" ? (appt?.price ?? "") : (product?.price ?? ""))).replace(",", "."));
      if (!Number.isFinite(value) || value <= 0) throw new Error("Informe um valor válido.");
      if (kind === "service" && !appt) throw new Error("Escolha o atendimento concluído.");
      if (kind === "product" && !product) throw new Error("Escolha o produto.");
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("payments").insert({
        kind,
        appointment_id: kind === "service" ? appt!.id : null,
        customer_id: kind === "service" ? appt!.customer_id : null,
        barber_id: kind === "service" ? appt!.barber_id : null,
        product_id: kind === "product" ? product!.id : null,
        amount: value,
        payment_method: method,
        payment_date: new Date(`${date}T12:00:00-03:00`).toISOString(),
        notes: notes.trim() || null,
        created_by: auth.user?.id ?? null,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Este atendimento já tem pagamento registrado.");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Pagamento registrado");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={kind === "service" ? "default" : "outline"} onClick={() => setKind("service")}>Atendimento</Button>
            <Button type="button" variant={kind === "product" ? "default" : "outline"} onClick={() => setKind("product")}>Venda de produto</Button>
          </div>
          {kind === "service" ? (
            <div className="space-y-2">
              <Label>Atendimento concluído (sem pagamento)</Label>
              <NativeSelect value={apptId} onChange={(e) => { setApptId(e.target.value); setAmount(""); }}>
                <option value="">Selecione</option>
                {opts.data?.appts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {formatDate(a.start_at)} · {a.customers?.full_name} · {a.service_name} ({a.barbers?.name})
                  </option>
                ))}
              </NativeSelect>
              {opts.data && !opts.data.appts.length && <p className="text-xs text-muted-foreground">Nenhum atendimento concluído sem pagamento nos últimos 60 dias.</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Produto</Label>
              <NativeSelect value={productId} onChange={(e) => { setProductId(e.target.value); setAmount(""); }}>
                <option value="">Selecione</option>
                {opts.data?.products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price)}</option>
                ))}
              </NativeSelect>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                inputMode="decimal"
                value={amount}
                placeholder={kind === "service" ? String(appt?.price ?? "") : String(product?.price ?? "")}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <NativeSelect value={method} onChange={(e) => setMethod(e.target.value as keyof typeof PAYMENT_METHODS)}>
              {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="animate-spin" />} Registrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
