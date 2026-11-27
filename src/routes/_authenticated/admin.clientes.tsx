import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCompany } from "@/lib/brand";
import { useStaff } from "@/lib/use-staff";
import { packagePeriod } from "@/lib/offers";
import { addMonthsKey, buildCustomerSubscriptionUpdate, formatDateKeyBr, parseSubscriptionMonths, subscriptionMonthsLabel } from "@/lib/customer-subscription";
import { errorMessage, formatDate, formatPhone, formatPrice, formatTime, normalizePhone, todayInShop, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Vyntra Tech" },
      { name: "description", content: "Gerencie clientes, histórico de atendimentos e assinaturas de pacotes." },
      { property: "og:title", content: "Clientes — Vyntra Tech" },
      { property: "og:description", content: "Lista de clientes e controle de assinaturas da sua empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data: staff } = useStaff();
  const { id: companyId } = useCompany();
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin", "customers", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, phone, created_at, is_subscriber, subscription_package_name, subscription_months, subscription_ends_at, appointments!appointments_customer_id_fkey(start_at, status)")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const t = term.trim().toLowerCase();
  const digits = normalizePhone(term);
  const filtered =
    list.data?.filter((c) => !t || c.full_name.toLowerCase().includes(t) || (digits.length >= 3 && c.phone.includes(digits))) ?? [];

  return (
    <>
      <PageHeader title={staff?.isAdmin ? "Clientes" : "Meus clientes"} subtitle="Cadastrados automaticamente no primeiro agendamento." />
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar por nome ou telefone" className="pl-9" />
      </div>
      {list.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : !filtered.length ? (
        <EmptyState text={list.data?.length ? "Nenhum cliente encontrado." : "Nenhum cliente ainda."} />
      ) : (
        <ul className="surface-card divide-y divide-border">
          {filtered.map((c) => {
            const done = c.appointments.filter((a) => a.status === "completed");
            const first = done.map((a) => a.start_at).sort()[0];
            return (
              <li key={c.id}>
                <button onClick={() => setSelected(c.id)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-surface-raised">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{c.full_name}</p>
                      {c.is_subscriber && (
                        <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Assinante
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatPhone(c.phone)}</p>
                    {c.is_subscriber && c.subscription_package_name && c.subscription_months && (
                      <p className="mt-0.5 text-xs text-primary">
                        {c.subscription_package_name} · {subscriptionMonthsLabel(c.subscription_months)}
                        {c.subscription_ends_at ? ` · até ${formatDateKeyBr(c.subscription_ends_at)}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{done.length} atendimento(s)</p>
                    <p>{first ? `desde ${formatDate(first)}` : "ainda sem atendimento"}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <CustomerDetail id={selected} isAdmin={!!staff?.isAdmin} companyId={companyId} onClose={() => setSelected(null)} />
    </>
  );
}

function CustomerDetail({ id, isAdmin, companyId, onClose }: { id: string | null; isAdmin: boolean; companyId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [offerId, setOfferId] = useState("");
  const [monthsRaw, setMonthsRaw] = useState("1");

  const q = useQuery({
    queryKey: ["admin", "customer", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, phone, created_at, is_subscriber, subscription_offer_id, subscription_package_name, subscription_months, subscription_started_at, subscription_ends_at, appointments!appointments_customer_id_fkey(id, start_at, service_name, price, status, barbers!appointments_barber_id_fkey(name))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const packages = useQuery({
    queryKey: ["admin", "customer-packages", companyId],
    enabled: !!id && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_offers")
        .select("id, name, price, period_months, is_active")
        .eq("company_id", companyId)
        .eq("kind", "package")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const c = q.data;
  useEffect(() => {
    if (!c) return;
    setIsSubscriber(c.is_subscriber);
    setOfferId(c.subscription_offer_id ?? "");
    setMonthsRaw(String(c.subscription_months ?? 1));
  }, [c]);

  const saveSubscription = useMutation({
    mutationFn: async () => {
      if (!c) return;
      const todayKey = todayInShop();
      const payload = buildCustomerSubscriptionUpdate({
        isSubscriber,
        offerId,
        fallbackPackageName: !offerId && c.subscription_package_name ? c.subscription_package_name : null,
        monthsRaw,
        startedAt: c.is_subscriber && c.subscription_started_at ? c.subscription_started_at : todayKey,
        todayKey,
      });
      const { error } = await supabase.from("customers").update(payload).eq("id", c.id).eq("company_id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assinatura do cliente salva");
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
      qc.invalidateQueries({ queryKey: ["admin", "customer", id] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const parsedMonths = parseSubscriptionMonths(monthsRaw);
  const startPreview = c?.is_subscriber && c.subscription_started_at ? c.subscription_started_at : todayInShop();
  const endPreview = parsedMonths ? addMonthsKey(startPreview, parsedMonths) : null;
  const history = [...(c?.appointments ?? [])].sort((a, b) => b.start_at.localeCompare(a.start_at));
  const hasPreservedPackage = !offerId && !!c?.subscription_package_name;

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{c?.full_name ?? "Cliente"}</DialogTitle>
        </DialogHeader>
        {c && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{formatPhone(c.phone)}</p>
              <Button asChild size="sm" variant="secondary">
                <a href={whatsappLink(`55${c.phone}`)} target="_blank" rel="noreferrer">
                  <MessageCircle /> WhatsApp
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Cliente desde {formatDate(c.created_at)}</p>

            {isAdmin ? (
              <form className="space-y-3 rounded-lg border border-border bg-surface p-4" onSubmit={(e) => { e.preventDefault(); saveSubscription.mutate(); }}>
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Cliente assinante</p>
                    <p className="text-xs text-muted-foreground">Defina se o cliente possui pacote de assinatura e por quantos meses.</p>
                  </div>
                  <Switch
                    checked={isSubscriber}
                    onCheckedChange={(checked) => {
                      setIsSubscriber(checked);
                      if (checked && !offerId && !c.subscription_package_name && packages.data?.[0]) {
                        setOfferId(packages.data[0].id);
                        setMonthsRaw(String(packages.data[0].period_months));
                      }
                    }}
                  />
                </label>
                {isSubscriber && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="customer-package">Pacote de assinatura</Label>
                      {packages.isLoading ? (
                        <p className="text-xs text-muted-foreground">Carregando pacotes...</p>
                      ) : !packages.data?.length && !hasPreservedPackage ? (
                        <p className="text-xs text-muted-foreground">
                          Nenhum pacote cadastrado ainda.{" "}
                          <Link to="/admin/ofertas" className="font-medium text-primary underline">Cadastrar em Pacotes e promoções</Link>
                        </p>
                      ) : (
                        <select
                          id="customer-package"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={offerId}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            setOfferId(nextId);
                            const pkg = packages.data?.find((p) => p.id === nextId);
                            if (pkg && !c.is_subscriber) setMonthsRaw(String(pkg.period_months));
                          }}
                        >
                          <option value="">{hasPreservedPackage ? `${c.subscription_package_name} (pacote removido)` : "Selecione um pacote"}</option>
                          {packages.data?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} · {formatPrice(p.price)} /{packagePeriod(p.period_months)}{!p.is_active ? " (oculto)" : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="customer-months">Quantidade de meses</Label>
                      <Input id="customer-months" type="number" inputMode="numeric" min={1} max={120} step={1} value={monthsRaw} onChange={(e) => setMonthsRaw(e.target.value)} />
                      {endPreview && (
                        <p className="text-xs text-muted-foreground">
                          Validade: {formatDateKeyBr(startPreview)} até {formatDateKeyBr(endPreview)} ({subscriptionMonthsLabel(parsedMonths!)})
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <Button type="submit" size="sm" className="w-full" disabled={saveSubscription.isPending}>
                  {saveSubscription.isPending && <Loader2 className="animate-spin" />}Salvar assinatura
                </Button>
              </form>
            ) : c.is_subscriber && c.subscription_package_name && c.subscription_months ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-semibold text-primary">Cliente assinante</p>
                <p className="text-xs text-muted-foreground">
                  {c.subscription_package_name} · {subscriptionMonthsLabel(c.subscription_months)}
                  {c.subscription_ends_at ? ` · até ${formatDateKeyBr(c.subscription_ends_at)}` : ""}
                </p>
              </div>
            ) : null}

            <h3 className="pt-2 text-sm font-semibold">Histórico</h3>
            {!history.length ? (
              <p className="text-sm text-muted-foreground">Sem agendamentos.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {history.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.service_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.start_at)} {formatTime(a.start_at)} · {a.barbers?.name} · {formatPrice(a.price)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
