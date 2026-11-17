import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStaff } from "@/lib/use-staff";
import { PLATFORM_NAME } from "@/lib/brand";
import { formatDate, shopDayStartIso } from "@/lib/format";
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_WHATSAPP, SUBSCRIPTION_STATUS, commercialPlanLabel, subscriptionState, subscriptionEndDate, isTrialSubscription } from "@/lib/subscriptions";
import { SubscriptionPlans } from "@/components/subscription-plans";

export const Route = createFileRoute("/_authenticated/assinatura")({
  head: () => ({ meta: [ { title: `Minha assinatura — ${PLATFORM_NAME}` }, { name: "description", content: "Status e renovação da assinatura da sua empresa." }, { property: "og:title", content: `Minha assinatura — ${PLATFORM_NAME}` }, { property: "og:description", content: "Status e renovação da assinatura da sua empresa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" } ] }),
  component: SubscriptionPage,
});
function SubscriptionPage() {
  const { data: staff, isLoading } = useStaff();
  const qc = useQueryClient();
  const subscription = useQuery({queryKey:["subscription",staff?.companyId],enabled:!!staff?.companyId,refetchInterval:30000,queryFn:async () => {
    if (!staff?.companyId) return null;
    const {data,error} = await supabase.from("company_subscriptions").select("status, plan, starts_at, expires_at, trial_ends_at").eq("company_id",staff.companyId).maybeSingle();
    if(error) throw error; return data;
  }});
  if(isLoading || subscription.isLoading) return <Loader2 className="mx-auto mt-20 size-8 animate-spin text-primary" />;
  const state = subscriptionState(subscription.data);
  const trial = isTrialSubscription(subscription.data);
  return <main className="mx-auto max-w-6xl px-4 py-16 sm:px-8"><ShieldCheck className="size-10 text-primary" /><h1 className="mt-5 text-3xl font-bold">Minha assinatura</h1>
    <div className="my-8 border-y border-border py-6"><h2 className="text-xl font-semibold">{subscription.isError ? "Não foi possível consultar a assinatura" : SUBSCRIPTION_STATUS[state]}</h2><p className="mt-2 text-muted-foreground">{commercialPlanLabel(subscription.data?.plan) ?? SUBSCRIPTION_PLANS.find((p) => p.value === subscription.data?.plan)?.label ?? "Seu cadastro aguarda aprovação."}</p>{subscription.data?.starts_at && <p className="mt-2 text-muted-foreground">Início: {formatDate(subscription.data.starts_at)}</p>}{subscription.data?.expires_at && <p className="mt-2 text-muted-foreground">Vencimento: {formatDate(shopDayStartIso(subscriptionEndDate(subscription.data.expires_at)))}</p>}<div className="mt-5 flex flex-wrap gap-3"><Button asChild><a href={SUBSCRIPTION_WHATSAPP} target="_blank" rel="noreferrer"><MessageCircle />{state === "active" ? "Renovar pelo WhatsApp" : "Assinar pelo WhatsApp"}</a></Button><Button variant="outline" onClick={() => qc.invalidateQueries({queryKey:["subscription"]})}><RefreshCw />Conferir liberação</Button></div></div>
    {trial && <p className="mb-8 text-primary">{state === "active" ? "Teste grátis de 7 dias em andamento." : state === "expired" ? "Seu teste grátis terminou. Assine pelo WhatsApp para continuar." : "Teste grátis indisponível."} Sem cobrança automática.</p>}
    <h2 className="mb-6 text-2xl font-semibold tracking-normal">Planos Vyntra Tech</h2><SubscriptionPlans />
    <div className="mt-8 flex flex-wrap gap-3">{state === "active" && <Button asChild variant="outline"><Link to="/admin">Voltar ao painel</Link></Button>}{staff?.isPlatformAdmin && <Button asChild variant="outline"><Link to="/empresas">Liberação de empresas</Link></Button>}<Button variant="ghost" onClick={async () => {await qc.cancelQueries();qc.clear();await supabase.auth.signOut();}}>Sair</Button></div>
  </main>;
}