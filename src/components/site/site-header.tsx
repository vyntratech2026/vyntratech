import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandName, Logo } from "./brand";
import { useCompany } from "@/lib/brand";

const SECTIONS = [
  { hash: "inicio", label: "Início" },
  { hash: "servicos", label: "Serviços" },
  { hash: "profissionais", label: "Profissionais" },
  { hash: "produtos", label: "Produtos" },
  { hash: "avaliacoes", label: "Avaliações" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { slug } = useCompany();
  const NAV = SECTIONS.map((n) => ({ ...n, href: `/${slug}#${n.hash}` }));
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/$slug" params={{ slug }} className="flex items-center gap-3">
          <Logo className="size-10" />
          <span className="hidden font-display text-sm font-semibold uppercase tracking-wider sm:block">
            <BrandName />
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/$slug/agendar" params={{ slug }}>Agendar</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border/60 bg-background px-4 pb-5 pt-2 md:hidden">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-base font-medium text-foreground/90"
            >
              {n.label}
            </a>
          ))}
          <Button asChild className="mt-3 w-full">
            <Link to="/$slug/agendar" params={{ slug }} onClick={() => setOpen(false)}>
              Agendar horário
            </Link>
          </Button>
        </nav>
      )}
    </header>
  );
}
