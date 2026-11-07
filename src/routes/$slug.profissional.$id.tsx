import { useCompany } from "@/lib/brand";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { MediaImage } from "@/components/site/brand";
import { barberServicesQuery, barbersQuery, servicesQuery } from "@/lib/public-data";
import { formatDuration, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/$slug/profissional/$id")({
  head: () => ({
    meta: [
      { title: "Profissional" },
      { name: "description", content: "Conheça o profissional e agende com ele." },
      { property: "og:title", content: "Profissional" },
      { property: "og:description", content: "Conheça o profissional e agende seu horário online." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BarberProfile,
});

function BarberProfile() {
  const slugCompany = useCompany();
  const { id } = Route.useParams();
  const { data: barbers, isLoading } = useQuery(barbersQuery(slugCompany.id));
  const { data: services } = useQuery(servicesQuery(slugCompany.id));
  const { data: links } = useQuery(barberServicesQuery(slugCompany.id));
  const barber = barbers?.find((b) => b.id === id);
  const offered = services?.filter((s) => links?.some((l) => l.barber_id === id && l.service_id === s.id)) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
        <Link to="/$slug" params={{ slug: slugCompany.slug }} hash="profissionais" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-surface" />
        ) : !barber ? (
          <p className="text-muted-foreground">Profissional não encontrado.</p>
        ) : (
          <div className="grid gap-10 md:grid-cols-[280px_1fr]">
            <MediaImage path={barber.photo_url} alt={barber.name} className="aspect-square w-full rounded-2xl" />
            <div className="space-y-5">
              <h1 className="text-3xl font-bold sm:text-4xl">{barber.name}</h1>
              {!!barber.specialties?.length && (
                <div className="flex flex-wrap gap-2">
                  {barber.specialties.map((sp) => (
                    <span key={sp} className="rounded-full border border-primary/30 px-3 py-1 text-xs text-primary">
                      {sp}
                    </span>
                  ))}
                </div>
              )}
              {barber.description && <p className="whitespace-pre-line text-muted-foreground">{barber.description}</p>}
              <Button asChild variant="hero" size="lg">
                <Link to="/$slug/agendar" params={{ slug: slugCompany.slug }} search={{ barbeiro: barber.id }}>
                  Agendar com {barber.name.split(" ")[0]}
                </Link>
              </Button>
              {offered.length > 0 && (
                <div className="space-y-3 pt-6">
                  <p className="eyebrow">Serviços</p>
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {offered.map((s) => (
                      <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span>{s.name}</span>
                        <span className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="size-3.5" />{formatDuration(s.duration_minutes)}</span>
                          <span className="font-semibold text-primary">{formatPrice(s.price)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
