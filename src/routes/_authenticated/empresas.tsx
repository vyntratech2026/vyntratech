import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Building2, Search, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PLATFORM_NAME } from "@/lib/brand";
import { addDaysKey, formatDate, errorMessage, shopDayStartIso, todayInShop } from "@/lib/format";
import { COMMERCIAL_PLANS, SUBSCRIPTION_STATUS, commercialPlanLabel, subscriptionState, subscriptionEndDate, savedCommercialPlan, type CommercialPlan } from "@/lib/subscriptions";
import { listPlatformCompanies, changeSubscription } from "@/lib/subscriptions.functions";
import platformLogo from "@/assets/logo-vyntra-tech.png.asset.json";

const companiesQuery = queryOptions({ queryKey: ["platform", "companies"], queryFn: () => listPlatformCompanies() });
export const Route = createFileRoute("/_authenticated/empresas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(companiesQuery),
  head: () => ({ meta: [
    { title: `Liberação de empresas — ${PLATFORM_NAME}` },
    { name: "description", content: "Administração das assinaturas e liberações de empresas da Vyntra Tech." },
    { property: "og:title", content: `Liberação de empresas — ${PLATFORM_NAME}` },
    { property: "og:description", content: "Administração das assinaturas e liberações de empresas da Vyntra Tech." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: PlatformCompanies,
  errorComponent: ({ error }) => <main className="mx-auto max-w-lg px-6 py-20 text-center"><ShieldCheck className="mx-auto size-10 text-primary" /><h1 className="mt-6 text-2xl font-bold">Acesso restrito</h1><p className="mt-3 text-muted-foreground">{errorMessage(error)}</p><Button asChild className="mt-6" variant="outline"><Link to="/admin">Voltar</Link></Button></main>,
});

function PlatformCompanies() {
  const { data: companies } = useSuspenseQuery(companiesQuery);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const qc = useQueryClient();
  const change = useServerFn(changeSubscription);
  const [confirm, setConfirm] = useState<{ id: string; name: string; plan: CommercialPlan; suspend: boolean; startDate: string; endDate: string } | null>(null);
  const mutation = useMutation({
    mutationFn: async () => { if (!confirm) return; await change({ data: { companyId: confirm.id, plan: confirm.plan, suspend: confirm.suspend, startDate: confirm.startDate, endDate: confirm.endDate } }); },
    onSuccess: async () => { toast.success(confirm?.suspend ? "Acesso suspenso." : "Acesso liberado."); setConfirm(null); await qc.invalidateQueries({ queryKey: ["platform"] }); await qc.invalidateQueries({ queryKey: ["subscription"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const filtered = companies.filter((c) => `${c.name} ${c.slug} ${c.ownerEmail ?? ""}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || subscriptionState(c.subscription) === filter));
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8"><img src={platformLogo.url} alt={PLATFORM_NAME} className="h-9 w-auto" /><Button variant="outline" asChild><Link to="/admin">Meu painel</Link></Button></div></header>
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <p className="eyebrow">Administração da plataforma</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-bold"><Building2 className="size-8 text-primary" /> Empresas</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-6 sm:grid-cols-4">{Object.entries(SUBSCRIPTION_STATUS).map(([key, label]) => <div key={key}><p className="text-3xl font-bold">{companies.filter((c) => subscriptionState(c.subscription) === key).length}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}</div>
      <div className="my-6 flex flex-wrap gap-3"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Buscar empresa" placeholder="Nome, e-mail ou link" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select aria-label="Filtrar por situação" className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Todas as situações</option>{Object.entries(SUBSCRIPTION_STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
      <div className="space-y-4">{filtered.map((company) => <CompanyRow key={`${company.id}:${company.subscription?.plan ?? "pending"}`} company={company} onAction={(plan, suspend) => {
        const startDate = todayInShop();
        const base = company.subscription?.expires_at && subscriptionState(company.subscription) === "active" ? company.subscription.expires_at : shopDayStartIso(startDate);
        const date = new Date(base);
        const key = subscriptionEndDate(base);
        const [year = date.getUTCFullYear(), month = 1, day = 1] = addDaysKey(key, 1).split("-").map(Number);
        const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const suggestedEnd = new Date(Date.UTC(year, month, Math.min(day, lastDay))).toISOString().slice(0, 10);
        setConfirm({id:company.id,name:company.name,plan,suspend,startDate,endDate:addDaysKey(suggestedEnd, -1)});
      }} />)}</div>
      {!filtered.length && <p className="py-16 text-center text-muted-foreground">{companies.length ? "Nenhuma empresa encontrada." : "Nenhuma empresa cadastrada."}</p>}
    </main>
    <Dialog open={!!confirm} onOpenChange={(open) => !open && !mutation.isPending && setConfirm(null)}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader><DialogTitle>{confirm?.suspend ? "Suspender acesso?" : "Liberar assinatura?"}</DialogTitle><DialogDescription className="break-words">{confirm?.name} · {confirm?.suspend ? "O site e o painel ficarão indisponíveis. Os dados serão preservados." : commercialPlanLabel(confirm?.plan)}</DialogDescription></DialogHeader>
        {confirm && !confirm.suspend && <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2"><Label htmlFor="subscription-start">Data de início</Label><Input id="subscription-start" type="date" value={confirm.startDate} onChange={(e) => setConfirm({ ...confirm, startDate: e.target.value })} /></div>
            <div className="min-w-0 space-y-2"><Label htmlFor="subscription-end">Data de vencimento</Label><Input id="subscription-end" type="date" min={confirm.startDate} value={confirm.endDate} onChange={(e) => setConfirm({ ...confirm, endDate: e.target.value })} /></div>
          </div>
          <p className="text-sm text-muted-foreground">O acesso começa na data escolhida e permanece disponível até o fim do dia do vencimento, no horário de Maceió. As datas informadas substituem o período atual.</p>
        </>}
        <div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirm(null)}>Cancelar</Button><Button disabled={mutation.isPending || (!confirm?.suspend && (!confirm?.startDate || !confirm?.endDate || confirm.endDate < confirm.startDate))} onClick={() => mutation.mutate()}>{mutation.isPending && <Loader2 className="animate-spin" />}{confirm?.suspend ? "Suspender" : "Confirmar liberação"}</Button></div>
      </DialogContent>
    </Dialog>
  </div>;
}

type Company = Awaited<ReturnType<typeof listPlatformCompanies>>[number];
function CompanyRow({ company, onAction }: { company: Company; onAction: (plan: CommercialPlan, suspend: boolean) => void }) {
  const [plan, setPlan] = useState<CommercialPlan>(() => savedCommercialPlan(company.subscription?.plan));
  const state = subscriptionState(company.subscription);
  return <article className="surface-card flex flex-col gap-6 p-5 lg:flex-row lg:items-center lg:justify-between">
    <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{company.name}</h2><p className="mt-1 break-all text-sm text-muted-foreground">{company.ownerEmail ?? "E-mail não disponível"}</p><a href={`/${company.slug}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-2 text-sm text-primary"><span className="truncate">/{company.slug}</span><ExternalLink className="size-3 shrink-0" /></a></div>
    <div className="shrink-0 text-sm"><p className={state === "active" ? "font-semibold text-primary" : "font-semibold text-muted-foreground"}>{SUBSCRIPTION_STATUS[state]}</p><p className="mt-1 text-muted-foreground">{commercialPlanLabel(company.subscription?.plan) ?? "Sem assinatura"}</p>{company.subscription?.starts_at && <p className="mt-1 text-muted-foreground">Início em {formatDate(company.subscription.starts_at)}</p>}<p className="mt-1 text-muted-foreground">{company.subscription?.expires_at ? `Vence em ${formatDate(shopDayStartIso(subscriptionEndDate(company.subscription.expires_at)))}` : company.subscription?.plan === "lifetime" ? "Sem vencimento" : "—"}</p></div>
    <div className="flex flex-wrap items-center gap-2"><select aria-label={`Plano para ${company.name}`} className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={plan} onChange={(e) => setPlan(e.target.value as CommercialPlan)}>{COMMERCIAL_PLANS.map((p) => <option key={p.value} value={p.value}>{p.name}</option>)}</select><Button onClick={() => onAction(plan, false)}>{state === "active" ? "Renovar" : "Liberar"}</Button>{state !== "suspended" && <Button variant="outline" onClick={() => onAction(plan, true)}>Suspender</Button>}</div>
  </article>;
}