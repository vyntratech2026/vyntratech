import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Tags, Repeat } from "lucide-react";
import { useCompany } from "@/lib/brand";
import { offersQuery } from "@/lib/offers-data";
import { settingsQuery } from "@/lib/public-data";
import { formatPrice, todayInShop, whatsappLink, formatDate, shopDayStartIso } from "@/lib/format";
import { packagePeriod } from "@/lib/offers";
import { Button } from "@/components/ui/button";
export function OffersSection() {
  const company = useCompany();
  const { data } = useQuery(offersQuery(company.id));
  const { data: settings } = useQuery(settingsQuery(company.id));
  const day = todayInShop();
  const offers = data?.filter((o) => o.kind === "package" || (o.start_date && o.end_date && o.start_date <= day && day <= o.end_date));
  if (!offers?.length) return null;
  return <section id="pacotes" className="border-t border-border"><div className="mx-auto max-w-6xl px-4 py-20 sm:px-6"><p className="eyebrow">Para você</p><h2 className="mb-8 mt-3 text-3xl font-bold">Pacotes e promoções</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{offers.map((o) => <article key={o.id} className="surface-card flex flex-col gap-4 p-5">
    {o.kind === "package" ? <Repeat className="text-primary" /> : <Tags className="text-primary" />}<h3 className="text-xl font-semibold break-words">{o.name}</h3><p className="text-2xl font-bold text-primary">{formatPrice(o.price)}{o.kind === "package" && <span className="text-sm font-normal text-muted-foreground"> /{packagePeriod(o.period_months)}</span>}</p>{o.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{o.description}</p>}{o.benefits && <p className="whitespace-pre-line text-sm">{o.benefits}</p>}{o.end_date && <p className="text-xs text-muted-foreground">Até {formatDate(shopDayStartIso(o.end_date))}</p>}
    {o.kind === "package" ? settings?.whatsapp && <Button asChild className="mt-auto"><a href={whatsappLink(settings.whatsapp, `Olá! Quero contratar a assinatura ${o.name} por ${formatPrice(o.price)} /${packagePeriod(o.period_months)}.`)} target="_blank" rel="noreferrer"><MessageCircle /> Assinar pelo WhatsApp</a></Button> : o.service_id && <Button asChild className="mt-auto"><Link to="/$slug/agendar" params={{ slug: company.slug }} search={{ servico: o.service_id }}>Agendar com promoção</Link></Button>}
  </article>)}</div></div></section>;
}