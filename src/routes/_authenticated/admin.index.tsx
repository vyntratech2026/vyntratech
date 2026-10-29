import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/fields";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { useStaff } from "@/lib/use-staff";
import { addDaysKey, formatPrice, formatTime, shopDayStartIso, todayInShop } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function monthRange() {
  const today = todayInShop();
  const first = `${today.slice(0, 7)}-01`;
  const [y, m] = first.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start: shopDayStartIso(first), end: shopDayStartIso(next) };
}

function Dashboard() {
  const { data: staff } = useStaff();
  const today = todayInShop();
  const dayStart = shopDayStartIso(today);
  const dayEnd = shopDayStartIso(addDaysKey(today, 1));
  const month = monthRange();

  const stats = useQuery({
    queryKey: ["dashboard", today],
    queryFn: async () => {
      const [monthAppts, todayAppts, payments, customers, barbers] = await Promise.all([
        supabase.from("appointments").select("id, status, price, barber_id").gte("start_at", month.start).lt("start_at", month.end),
        supabase
          .from("appointments")
          .select("id, status, start_at, service_name, barber_id, customers(full_name), barbers(name)")
          .gte("start_at", dayStart)
          .lt("start_at", dayEnd)
          .order("start_at"),
        supabase.from("payments").select("amount, kind, barber_id").gte("payment_date", month.start).lt("payment_date", month.end),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        staff?.barberId
          ? supabase.from("barbers").select("commission_percent").eq("id", staff.barberId)
          : Promise.resolve({ data: [] as { commission_percent: number }[] }),
      ]);
      const m = monthAppts.data ?? [];
      const pay = payments.data ?? [];
      const serviceRevenue = pay.filter((p) => p.kind === "service").reduce((a, p) => a + Number(p.amount), 0);
      const total = pay.reduce((a, p) => a + Number(p.amount), 0);
      const commissionPct = Number(barbers.data?.[0]?.commission_percent ?? 0);
      return {
        today: todayAppts.data ?? [],
        month: m.filter((a) => a.status !== "cancelled").length,
        completed: m.filter((a) => a.status === "completed").length,
        upcoming: m.filter((a) => a.status === "confirmed" || a.status === "pending").length,
        cancelled: m.filter((a) => a.status === "cancelled").length,
        noShow: m.filter((a) => a.status === "no_show").length,
        revenue: total,
        serviceRevenue,
        commission: (serviceRevenue * commissionPct) / 100,
        commissionPct,
        customers: customers.count ?? 0,
      };
    },
    enabled: !!staff,
  });

  const s = stats.data;
  const isAdmin = !!staff?.isAdmin;

  return (
    <>
      <PageHeader
        title={isAdmin ? "Dashboard" : `Olá, ${staff?.name.split(" ")[0] ?? ""}`}
        subtitle={new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Maceio", dateStyle: "full" }).format(new Date())}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/agendamentos">Ver agendamentos</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Hoje" value={s ? s.today.filter((a) => a.status !== "cancelled").length : "–"} hint="agendamentos" accent />
        <StatCard label="No mês" value={s?.month ?? "–"} hint="agendamentos (sem cancelados)" />
        <StatCard label="Concluídos" value={s?.completed ?? "–"} hint="atendimentos no mês" />
        <StatCard label="A atender" value={s?.upcoming ?? "–"} hint="confirmados no mês" />
        <StatCard label="Cancelamentos" value={s?.cancelled ?? "–"} hint={s ? `${s.noShow} não compareceram` : undefined} />
        {isAdmin ? (
          <>
            <StatCard label="Faturamento do mês" value={s ? formatPrice(s.revenue) : "–"} hint="pagamentos registrados" accent />
            <StatCard label="Clientes" value={s?.customers ?? "–"} hint="cadastrados" />
          </>
        ) : (
          <>
            <StatCard label="Meus cortes pagos" value={s ? formatPrice(s.serviceRevenue) : "–"} hint="no mês" />
            <StatCard label="Minha comissão" value={s ? formatPrice(s.commission) : "–"} hint={s ? `${s.commissionPct}% sobre cortes` : undefined} accent />
          </>
        )}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Agenda de hoje</h2>
        {stats.isLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-surface" />
        ) : !s?.today.length ? (
          <EmptyState text="Nenhum agendamento para hoje." />
        ) : (
          <ul className="surface-card divide-y divide-border">
            {s.today.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
                <span className="w-14 font-display font-bold text-primary">{formatTime(a.start_at)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.customers?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.service_name} · {a.barbers?.name}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
