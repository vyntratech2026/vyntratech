import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, MessageCircle, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_NAME } from "@/lib/brand";
import { SUBSCRIPTION_WHATSAPP } from "@/lib/subscriptions";
import platformLogo from "@/assets/logo-vyntra-tech.png.asset.json";
import dashboardDevices from "@/assets/vyntra-dashboard-devices.webp.asset.json";
import { SubscriptionPlans } from "@/components/subscription-plans";
import { LandingFAQ, LandingFeatures, LandingWorkflow } from "@/components/landing-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${PLATFORM_NAME} — Site de agendamento e gestão do seu negócio` },
      { name: "description", content: "Conheça a Vyntra Tech: agenda online, financeiro, profissionais, produtos e site personalizado. Teste grátis por 7 dias. Planos a partir de R$ 29,90/mês." },
      { property: "og:title", content: `${PLATFORM_NAME} — Seu negócio conectado, sua gestão no controle` },
      { property: "og:description", content: "Conheça o painel no computador e no celular. Agenda, equipe, financeiro e site próprio, com teste grátis por 7 dias e sem cobrança automática." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="landing-page min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="landing-container flex h-[72px] items-center justify-between gap-3">
          <Link to="/" aria-label="Vyntra Tech — início" className="shrink-0"><img src={platformLogo.url} alt={PLATFORM_NAME} className="h-auto w-32 sm:w-40" width="160" height="45" /></Link>
          <nav aria-label="Menu principal" className="hidden items-center gap-1 md:flex">
            <Button asChild variant="ghost" size="sm"><a href="#recursos">Recursos</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="#planos">Planos</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="#faq">Dúvidas</a></Button>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
            <Button asChild size="sm" className="h-9 px-3 sm:px-4"><Link to="/auth" search={{ modo: "cadastro" }}>Testar grátis <ArrowRight className="hidden sm:block" /></Link></Button>
          </div>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-copy text-center">
            <p className="landing-label flex items-center justify-center gap-2"><span className="size-1.5 rounded-full bg-primary-glow" /> PARA QUEM VIVE DE ATENDER BEM</p>
            <h1 className="mt-4 font-semibold">Vyntra Tech<span className="mt-2 block font-sans text-2xl font-medium sm:text-3xl">Seu negócio conectado.<span className="text-primary-glow"> Sua gestão no controle.</span></span></h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Agenda, equipe, financeiro e um site com a sua marca.<br className="hidden sm:block" /> Tudo conectado para barbearias, salões e negócios com horário marcado.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="px-6"><Link to="/auth" search={{ modo: "cadastro" }}>Começar meus 7 dias grátis <ArrowRight /></Link></Button>
              <Button asChild variant="ghost" size="lg" className="px-5"><a href="#recursos">Conhecer o sistema <ArrowDown /></a></Button>
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" /> Sem cobrança automática. Sua empresa, seu espaço.</p>
          </div>
          <figure className="mx-auto mt-3 max-w-6xl">
            <img src={dashboardDevices.url} alt="Dashboard real da Vyntra Tech em um MacBook e um iPhone lado a lado, com agenda, indicadores e financeiro; dados privados ocultos." width="1480" height="865" fetchPriority="high" className="landing-hero-image" />
            <figcaption className="mb-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><MonitorSmartphone className="size-3.5" /> No computador e no celular</span><span className="flex items-center gap-1.5"><Check className="size-3.5 text-primary-glow" /> Sem instalar aplicativo</span><span>Captura real · dados privados ocultos</span></figcaption>
          </figure>
        </section>
        <LandingFeatures />
        <LandingWorkflow />
        <section id="planos" className="landing-section border-y border-border bg-surface/40">
          <div className="landing-container">
            <div className="mb-10 text-center"><p className="landing-label">CRESÇA NO SEU RITMO</p><h2 className="landing-heading mt-3">Planos e assinaturas  Vyntra Tech</h2><p className="mt-4 text-sm text-muted-foreground">Todas as funcionalidades. Um plano para o tamanho da sua equipe.</p></div>
            <SubscriptionPlans />
            <p className="mt-6 text-center text-xs leading-6 text-muted-foreground">Comece com 7 dias grátis. Contratação pelo WhatsApp, sem cobrança automática.</p>
          </div>
        </section>
        <LandingFAQ />
        <section className="border-t border-border bg-primary py-14 text-primary-foreground sm:py-16">
          <div className="landing-container flex flex-wrap items-center justify-between gap-8"><div className="max-w-2xl"><p className="text-xs font-semibold text-primary-foreground/75">SEU NEGÓCIO MERECE ESSE PRÓXIMO PASSO</p><h2 className="landing-heading mt-3">Mais organização.<br />Mais tempo para atender bem.</h2><p className="mt-4 text-sm text-primary-foreground/80">Experimente a Vyntra Tech por 7 dias grátis.</p></div><Button asChild size="lg" variant="secondary" className="px-6"><Link to="/auth" search={{ modo: "cadastro" }}>Criar minha conta <ArrowRight /></Link></Button></div>
        </section>
      </main>
      <footer className="landing-container flex flex-wrap items-center justify-between gap-5 py-8">
        <div><img src={platformLogo.url} alt={PLATFORM_NAME} className="w-32" width="128" height="36" /><p className="mt-3 text-xs text-muted-foreground">© {new Date().getFullYear()} {PLATFORM_NAME}</p></div>
        <div className="flex flex-wrap items-center gap-2"><Button asChild variant="ghost" size="sm"><a href="#faq">Perguntas frequentes</a></Button><Button asChild variant="ghost" size="sm"><a href={SUBSCRIPTION_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle /> Fale com a gente</a></Button></div>
      </footer>
    </div>
  );
}
