import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Palette, Users, Wallet, Bell, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_NAME } from "@/lib/brand";
import platformLogo from "@/assets/logo-vyntra-tech.png.asset.json";
import { SubscriptionPlans } from "@/components/subscription-plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${PLATFORM_NAME} — Agenda online e painel para o seu negócio` },
      { name: "description", content: "Teste grátis por 7 dias. Planos Vyntra Start, Pro e Business a partir de R$ 29,90 por mês, com agenda, equipe e financeiro." },
      { property: "og:title", content: `${PLATFORM_NAME} — Agenda online para o seu negócio` },
      { property: "og:description", content: "Teste grátis por 7 dias. Vyntra Start, Pro e Business a partir de R$ 29,90 por mês, com todas as funcionalidades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Link2, title: "Seu próprio site", text: "Um link só seu para os clientes verem serviços e marcarem horário." },
  { icon: CalendarCheck, title: "Agenda sem conflito", text: "O sistema nunca deixa dois clientes no mesmo horário do mesmo profissional." },
  { icon: Users, title: "Equipe", text: "Cada profissional tem acesso próprio, horários e folgas." },
  { icon: Wallet, title: "Financeiro", text: "Recebimentos, vendas de produtos e comissão por profissional." },
  { icon: Palette, title: "Sua marca", text: "Logo, nome e cores do seu jeito, sem afetar ninguém." },
  { icon: Bell, title: "Aviso no celular", text: "Receba uma notificação a cada novo agendamento." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <img src={platformLogo.url} alt={PLATFORM_NAME} className="h-8 w-auto" />
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
          <Button asChild size="sm"><Link to="/auth" search={{ modo: "cadastro" }}>Criar conta</Link></Button>
        </div>
      </header>
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-radial-glow" />
        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <p className="eyebrow">Para negócios com horário marcado</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-6xl">
            Sua agenda online <span className="text-primary text-glow">pronta em minutos</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Barbearia, salão, estética, manicure, tatuagem ou consultório: teste grátis por 7 dias. Sem cobrança automática.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="xl" variant="hero"><Link to="/auth" search={{ modo: "cadastro" }}>Testar grátis por 7 dias</Link></Button>
            <Button asChild size="xl" variant="outline"><Link to="/auth">Já tenho conta</Link></Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6"><h2 className="mb-8 text-center text-2xl font-semibold tracking-normal">Planos e assinaturas  Vyntra Tech</h2><SubscriptionPlans /></section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="surface-card p-6">
            <f.icon className="size-6 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {PLATFORM_NAME}
      </footer>
    </div>
  );
}
