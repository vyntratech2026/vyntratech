import { Check, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMMERCIAL_PLANS, PLAN_FEATURES, SUBSCRIPTION_WHATSAPP } from "@/lib/subscriptions";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function SubscriptionPlans() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {COMMERCIAL_PLANS.map((plan) => (
        <article key={plan.value} className="flex min-w-0 flex-col rounded-lg border border-border bg-surface p-6 sm:p-7">
          <h3 className="text-xl font-semibold tracking-normal">{plan.name}</h3>
          <p className="mt-6 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{currency.format(plan.monthlyPriceCents / 100)}</span>
            <span className="text-sm text-muted-foreground">/mês</span>
          </p>
          <p className="mt-5 flex items-center gap-2 text-sm font-semibold"><Users className="size-4 shrink-0 text-primary-glow" />{plan.professionalLimit === null ? "Profissionais ilimitados" : `Até ${plan.professionalLimit} profissionais`}</p>
          <div className="my-6 border-t border-border" />
          <p className="text-sm font-semibold">Todas as funcionalidades incluídas:</p>
          <ul className="mb-7 mt-4 space-y-3">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-primary-glow" /><span>{feature === "Cadastro de profissionais" && plan.professionalLimit === null ? "Cadastro ilimitado de profissionais" : feature}</span></li>
            ))}
          </ul>
          <Button asChild className="mt-auto w-full"><a href={SUBSCRIPTION_WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label={`Assinar ${plan.name} pelo WhatsApp`}><MessageCircle />Assinar pelo WhatsApp</a></Button>
        </article>
      ))}
    </div>
  );
}