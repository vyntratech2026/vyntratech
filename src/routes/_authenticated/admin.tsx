import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bell,
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
import { Logo } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
import { useStaff } from "@/lib/use-staff";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel — Studio Cleison Cortes" },
      { name: "description", content: "Painel administrativo do Studio Cleison Cortes." },
      { property: "og:title", content: "Painel — Studio Cleison Cortes" },
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
  { to: "/admin/barbeiros", label: "Barbeiros", icon: Users },
  { to: "/admin/servicos", label: "Serviços", icon: Scissors },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

const BARBER_NAV: NavItem[] = [
  { to: "/admin", label: "Meu painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/agendamentos", label: "Meus agendamentos", icon: CalendarClock },
  { to: "/admin/bloqueios", label: "Fechar agenda", icon: CalendarOff },
  { to: "/admin/clientes", label: "Meus clientes", icon: UserRound },
];

function AdminLayout() {
  const { data: staff, isLoading } = useStaff();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
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

  const nav = staff.isAdmin ? ADMIN_NAV : BARBER_NAV;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <Logo className="size-10" />
        <div className="leading-tight">
          <p className="font-display text-xs font-semibold uppercase tracking-wider">
            Cleison <span className="text-primary">Cortes</span>
          </p>
          <p className="text-[11px] text-muted-foreground">{staff.isAdmin ? "Administrador" : "Barbeiro"}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
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
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
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
  );
}
