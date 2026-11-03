import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Instagram, MapPin, MessageCircle, Star } from "lucide-react";
import heroFallback from "@/assets/hero-fallback.jpg";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BrandName, Logo, MediaImage } from "@/components/site/brand";
import { VideosSection } from "@/components/site/videos-section";
import {
  barbersQuery,
  productsQuery,
  reviewsQuery,
  servicesQuery,
  settingsQuery,
} from "@/lib/public-data";
import { useSignedUrl } from "@/lib/media";
import { formatDate, formatDuration, formatPrice, SHOP_WHATSAPP, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio Cleison Cortes — Barbearia em Aracaju | Agende online" },
      {
        name: "description",
        content:
          "Studio Cleison Cortes, barbearia na Rua Urbano Neto, 763, Aracaju. Veja serviços, profissionais e agende seu horário online.",
      },
      { property: "og:title", content: "Studio Cleison Cortes — Barbearia em Aracaju" },
      {
        property: "og:description",
        content: "Agende seu corte online no Studio Cleison Cortes, em Aracaju – SE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-10 space-y-3">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
    </div>
  );
}

function Index() {
  const { data: s } = useQuery(settingsQuery());
  const { data: services } = useQuery(servicesQuery());
  const { data: barbers } = useQuery(barbersQuery());
  const { data: products } = useQuery(productsQuery());
  const { data: reviews } = useQuery(reviewsQuery());
  const coverUrl = useSignedUrl(s?.cover_url);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section id="inicio" className="relative flex min-h-[92vh] items-end overflow-hidden pt-16">
        <img
          src={coverUrl ?? heroFallback}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 bg-radial-glow opacity-60" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="max-w-2xl animate-fade-up space-y-6">
            <Logo className="size-24 animate-glow-pulse sm:size-28" />
            <h1 className="text-4xl font-bold leading-[1.05] sm:text-6xl">
              <BrandName accentClassName="text-glow" />
            </h1>
            <p className="max-w-lg text-lg text-foreground/80">
              {s?.tagline || "Barbearia em Aracaju. Escolha o serviço, o barbeiro e o horário em poucos toques."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="hero" size="xl">
                <Link to="/agendar">Agendar horário</Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <a href={whatsappLink(s?.whatsapp || SHOP_WHATSAPP)} target="_blank" rel="noreferrer">
                  <MessageCircle /> WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <SectionTitle eyebrow="A barbearia" title="Sobre o Studio" />
            {s?.description ? (
              <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{s.description}</p>
            ) : null}
          </div>
          <div className="surface-card space-y-5 p-6 sm:p-8">
            {s?.address && (
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{s.address}</p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{s?.phone ?? "(79) 99689-1622"}</p>
              </div>
            </div>
            {s?.instagram && (
              <div className="flex gap-3">
                <Instagram className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Instagram</p>
                  <a href={s.instagram} target="_blank" rel="noreferrer" className="font-medium hover:text-primary">
                    @studiocleisoncortes
                  </a>
                </div>
              </div>
            )}
            {s?.maps_url && (
              <Button asChild variant="outline" className="w-full">
                <a href={s.maps_url} target="_blank" rel="noreferrer">
                  <MapPin /> Abrir no Google Maps
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      <VideosSection />

      {/* SERVIÇOS */}
      {!!services?.length && (
        <section id="servicos" className="border-t border-border bg-surface/30">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <SectionTitle eyebrow="O que fazemos" title="Serviços" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((sv) => (
                <article key={sv.id} className="surface-card group overflow-hidden transition-all hover:border-primary/40">
                  <MediaImage path={sv.photo_url} alt={sv.name} className="aspect-[4/3] w-full" />
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold">{sv.name}</h3>
                      <span className="font-display text-lg font-bold text-primary">{formatPrice(sv.price)}</span>
                    </div>
                    {sv.description && <p className="text-sm text-muted-foreground">{sv.description}</p>}
                    <div className="flex items-center justify-between pt-2">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5" /> {formatDuration(sv.duration_minutes)}
                      </span>
                      <Button asChild size="sm">
                        <Link to="/agendar" search={{ servico: sv.id }}>
                          Agendar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROFISSIONAIS */}
      {!!barbers?.length && (
        <section id="profissionais" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionTitle eyebrow="Nossa equipe" title="Profissionais" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {barbers.map((b) => (
              <article key={b.id} className="surface-card overflow-hidden">
                <MediaImage path={b.photo_url} alt={b.name} className="aspect-square w-full" />
                <div className="space-y-3 p-5">
                  <h3 className="text-lg font-semibold">{b.name}</h3>
                  {!!b.specialties?.length && (
                    <div className="flex flex-wrap gap-1.5">
                      {b.specialties.map((sp) => (
                        <span key={sp} className="rounded-full border border-primary/30 px-2.5 py-0.5 text-xs text-primary">
                          {sp}
                        </span>
                      ))}
                    </div>
                  )}
                  {b.description && <p className="line-clamp-3 text-sm text-muted-foreground">{b.description}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to="/profissional/$id" params={{ id: b.id }}>
                        Ver perfil
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/agendar" search={{ barbeiro: b.id }}>
                        Agendar
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* PRODUTOS */}
      {!!products?.length && (
        <section id="produtos" className="border-t border-border bg-surface/30">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <SectionTitle eyebrow="Disponíveis na barbearia" title="Produtos" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.map((p) => (
                <article key={p.id} className="surface-card overflow-hidden">
                  <MediaImage path={p.photo_url} alt={p.name} className="aspect-square w-full" />
                  <div className="space-y-2 p-4">
                    <h3 className="text-sm font-semibold sm:text-base">{p.name}</h3>
                    {p.description && <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-display font-bold text-primary">{formatPrice(p.price)}</span>
                      <span className={p.is_available ? "text-xs text-primary" : "text-xs text-muted-foreground"}>
                        {p.is_available ? "Disponível" : "Esgotado"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AVALIAÇÕES */}
      {!!reviews?.length && (
        <section id="avaliacoes" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionTitle eyebrow="Quem já veio" title="Avaliações" />
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="surface-card space-y-4 p-6">
                <div className="flex gap-0.5" aria-label={`${r.rating} de 5 estrelas`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={i < r.rating ? "size-4 fill-primary text-primary" : "size-4 text-muted"} />
                  ))}
                </div>
                {r.comment && <blockquote className="text-sm leading-relaxed text-foreground/85">“{r.comment}”</blockquote>}
                <figcaption className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{r.reviewer_name}</span>
                  <span>{formatDate(r.created_at)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Bora dar um trato no visual?</h2>
          <p className="mt-4 text-muted-foreground">Escolha o serviço, o barbeiro e o horário que preferir.</p>
          <Button asChild variant="hero" size="xl" className="mt-8">
            <Link to="/agendar">Agendar horário</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
