import { Bell, CalendarCheck, Check, Link2, Package, Palette, Scissors, ShieldCheck, Users, Wallet } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FEATURES = [
  { icon: CalendarCheck, title: "Uma agenda organizada", text: "Agendamentos online confirmados, escolha do profissional e bloqueios de horários. Sem duas reservas no mesmo horário para a mesma pessoa.", detail: "Agendamento online + gestão da agenda" },
  { icon: Wallet, title: "Seu financeiro, sem achismo", text: "Acompanhe pagamentos, vendas de produtos e comissões sobre serviços. Veja os indicadores do seu negócio em um só painel.", detail: "Financeiro + dashboard + relatórios" },
  { icon: Users, title: "Uma equipe conectada", text: "Cada profissional tem seu próprio acesso para acompanhar atendimentos e fechar a agenda quando precisar.", detail: "Profissionais + clientes + acessos individuais" },
  { icon: Palette, title: "Seu site. Sua identidade.", text: "Um endereço exclusivo com sua logo, nome, cores, serviços, fotos e vídeos. Sua personalização não muda a de outras empresas.", detail: "Site próprio + personalização" },
  { icon: Package, title: "Mais oportunidades de venda", text: "Cadastre produtos para o cliente incluir no agendamento, divulgue pacotes pelo WhatsApp e crie promoções de serviços com prazo definido.", detail: "Produtos + pacotes + promoções" },
  { icon: Bell, title: "Mais perto dos seus clientes", text: "Receba avisos de novos agendamentos no celular com Pushcut, gerencie avaliações no site e disponibilize seu link de avaliação do Google.", detail: "Notificações + avaliações" },
];

const FAQ = [
  { question: "Como funciona o teste grátis de 7 dias?", answer: "Crie sua conta e cadastre sua empresa para começar o teste de 7 dias, com as funcionalidades do sistema e capacidade de até 3 profissionais. Não há cobrança automática. Depois do teste, você pode contratar um plano pelo WhatsApp." },
  { question: "O que muda entre Start, Pro e Business?", answer: "Todos os planos incluem as funcionalidades apresentadas. A diferença é a capacidade da equipe: Start permite até 3 profissionais, Pro até 6 e Business não tem limite de profissionais." },
  { question: "Funciona no celular e no computador?", answer: "Sim. Você e sua equipe podem acessar o painel pelo navegador do celular ou do computador, sem instalar um aplicativo. Seus clientes também podem agendar pelo celular." },
  { question: "Minha empresa terá um site próprio?", answer: "Sim. Sua empresa recebe um endereço exclusivo dentro da plataforma. Você pode personalizar logo, nome e cores, além de cadastrar serviços, profissionais, produtos, fotos e vídeos, sem afetar outras empresas." },
  { question: "Como meu cliente faz um agendamento?", answer: "Pelo link da sua empresa, o cliente escolhe o serviço, o profissional e um horário disponível. A reserva já entra confirmada, e o sistema impede conflitos de horário. O cliente recebe um link privado para consultar o agendamento e cancelar com pelo menos 1 hora de antecedência." },
  { question: "Como faço para assinar ou mudar de plano?", answer: "A contratação e as mudanças de plano são combinadas pelo WhatsApp da Vyntra Tech. A liberação é feita pela administração da plataforma. Não há pagamento ou renovação automática pelo site." },
  { question: "O sistema envia lembretes automáticos pelo WhatsApp?", answer: "O envio automático de lembretes pelo WhatsApp ainda não está disponível. Os avisos de novos agendamentos no celular funcionam com a configuração do Pushcut. Os links de WhatsApp abrem a conversa para você enviar a mensagem." },
];

export function LandingFeatures() {
  return (
    <section id="recursos" className="landing-section border-y border-border bg-surface/40">
      <div className="landing-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl"><p className="landing-label">DO AGENDAMENTO À GESTÃO</p><h2 className="landing-heading mt-3">Tudo o que seu negócio<br className="hidden sm:block" /> precisa, no mesmo lugar.</h2></div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">Menos tarefas espalhadas.<br />Mais clareza para cuidar do seu negócio.</p>
        </div>
        <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, detail }) => <article key={title} className="border-t border-border pt-6"><Icon className="size-7 text-primary-glow" /><h3 className="mt-5 font-sans text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p><p className="mt-5 flex items-start gap-2 text-xs font-medium text-foreground/80"><Check className="size-4 shrink-0 text-primary-glow" />{detail}</p></article>)}
        </div>
      </div>
    </section>
  );
}

export function LandingWorkflow() {
  return <section className="landing-section"><div className="landing-container"><p className="landing-label">DO SEU JEITO, DESDE O INÍCIO</p><h2 className="landing-heading mt-3">Seu próximo passo é simples.</h2><div className="mt-10 grid gap-8 md:grid-cols-3">{[
    { number: "01", icon: ShieldCheck, title: "Crie sua conta", text: "Cadastre sua empresa e comece seus 7 dias de teste gratuito." },
    { number: "02", icon: Scissors, title: "Deixe tudo com a sua cara", text: "Adicione seus serviços e profissionais. Escolha sua logo, cores e horários." },
    { number: "03", icon: Link2, title: "Compartilhe seu link", text: "Coloque seu endereço no Instagram e envie aos clientes para receber agendamentos." },
  ].map(({ number, icon: Icon, title, text }) => <article key={number} className="border-t border-border pt-5"><div className="flex items-center justify-between"><span className="font-display text-3xl text-muted-foreground/40">{number}</span><Icon className="size-5 text-primary-glow" /></div><h3 className="mt-5 font-sans text-lg font-semibold">{title}</h3><p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">{text}</p></article>)}</div></div></section>;
}

export function LandingFAQ() {
  return <section id="faq" className="landing-section border-t border-border"><div className="landing-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="landing-label">PERGUNTAS FREQUENTES</p><h2 className="landing-heading mt-3">Vamos tirar<br />suas dúvidas.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">O essencial para começar com tranquilidade.</p></div><Accordion type="single" collapsible className="min-w-0">{FAQ.map((item, index) => <AccordionItem key={item.question} value={`faq-${index}`}><AccordionTrigger className="gap-5 py-6 text-base leading-6 hover:no-underline">{item.question}</AccordionTrigger><AccordionContent className="pr-6 text-sm leading-7 text-muted-foreground">{item.answer}</AccordionContent></AccordionItem>)}</Accordion></div></section>;
}