import { createFileRoute, Link, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bell,
  CircleUser,
  Palette,
  CalendarClock,
  CalendarOff,
  ExternalLink,
  Package,
  Star,
  UserRound,
  Wallet,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandName, Logo } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
import { useStaff } from "@/lib/use-staff";
import { CompanyProvider, loadBrand, PLATFORM_NAME } from "@/lib/brand";
import { themeCss } from "@/lib/theme";
import { subscriptionState } from "@/lib/subscriptions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: `Painel — ${PLATFORM_NAME}` },
      { name: "description", content: "Painel da sua empresa." },
      { property: "og:title", content: `Painel — ${PLATFORM_NAME}` },
      { property: "og:description", content: "Painel administrativo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean };

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/agendamentos", label: "Agendamentos", icon: CalendarClock },
  { to: "/admin/bloqueios", label: "Folgas e bloqueios", icon: CalendarOff },
  { to: "/admin/clientes", label: "Clientes", icon: UserRound },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/admin/barbeiros", label: "Profissionais", icon: Users },
  { to: "/admin/servicos", label: "Serviços", icon: Scissors },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { to: "/admin/aparencia", label: "Aparência", icon: Palette },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { to: "/admin/conta", label: "Minha conta", icon: CircleUser },
  { to: "/assinatura", label: "Assinatura", icon: CalendarClock },
];

const BARBER_NAV: NavItem[] = [
  { to: "/admin", label: "Meu painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/agendamentos", label: "Meus agendamentos", icon: CalendarClock },
  { to: "/admin/bloqueios", label: "Fechar agenda", icon: CalendarOff },
  { to: "/admin/clientes", label: "Meus clientes", icon: UserRound },
  { to: "/admin/conta", label: "Minha conta", icon: CircleUser },
];

function AdminLayout() {
  const { data: staff, isLoading } = useStaff();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const brandQ = useQuery({
    queryKey: ["admin", "brand", staff?.companyId],
    enabled: !!staff?.companyId,
    queryFn: () => { if (!staff?.companyId) throw new Error("Empresa não encontrada."); return loadBrand(staff.companyId); },
  });
  const subscriptionQ = useQuery({
    queryKey: ["subscription", staff?.companyId], enabled: !!staff?.companyId, refetchInterval: 30000,
    queryFn: async () => {
      if (!staff?.companyId) return null;
      const { data, error } = await supabase.from("company_subscriptions").select("status, plan, expires_at").eq("company_id", staff.companyId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (staff && !staff.companyId) return staff.isPlatformAdmin ? <Navigate to="/empresas" replace /> : <Navigate to="/comecar" replace />;

  if (isLoading || (staff?.companyId && (!brandQ.data || subscriptionQ.isLoading))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Logo className="size-16 animate-glow-pulse" />
      </div>
    );
  }

  if (!staff || (!staff.isAdmin && !staff.isBarber)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="surface-card max-w-sm p-8 text-center">
          <h1 className="text-lg font-bold">Acesso não liberado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sua conta ainda não tem permissão. Fale com o administrador.</p>
          <Button className="mt-6" variant="outline" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (subscriptionQ.isError || subscriptionState(subscriptionQ.data) !== "active") return <Navigate to="/assinatura" replace />;
  if (!staff.companyId || !brandQ.data) return null;
  const nav = [...(staff.isAdmin ? ADMIN_NAV : BARBER_NAV), ...(staff.isPlatformAdmin ? [{ to: "/empresas", label: "Liberação de empresas", icon: Users }] : [])];
  const company = { id: staff.companyId, slug: staff.companySlug ?? "", brand: brandQ.data };
  const css = themeCss(company.brand.colors);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <Logo className="size-10" />
        <div className="leading-tight">
          <p className="font-display text-xs font-semibold uppercase tracking-wider">
            <BrandName />
          </p>
          <p className="text-[11px] text-muted-foreground">{staff.isAdmin ? "Administrador" : "Profissional"}</p>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 [scrollbar-width:thin]">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: !!item.exact }}
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border p-3">
        <a href={`/${company.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
          <ExternalLink className="size-4" /> Ver site
        </a>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
          <LogOut className="size-4" /> Sair
        </button>
        <p className="truncate px-3 pt-2 text-xs text-muted-foreground">{staff.name}</p>
      </div>
    </div>
  );

  return (
    <CompanyProvider company={company}>
    {css && <style id="brand-theme" dangerouslySetInnerHTML={{ __html: css }} />}
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r border-sidebar-border bg-sidebar">
            <button className="absolute right-3 top-6 p-2" aria-label="Fechar menu" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl lg:hidden">
        <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setOpen(true)}>
          <Menu />
        </Button>
        <Logo className="size-8" />
      </header>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
    </CompanyProvider>
  );
}
