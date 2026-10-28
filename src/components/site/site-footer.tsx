import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MapPin, MessageCircle } from "lucide-react";
import { settingsQuery, hasOpeningHours } from "@/lib/public-data";
import { DAY_NAMES, SHOP_WHATSAPP, whatsappLink } from "@/lib/format";
import { Logo } from "./brand";

export function SiteFooter() {
  const { data: s } = useQuery(settingsQuery());
  const oh = s?.opening_hours;
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <Logo className="size-16" />
          <p className="font-display text-lg font-semibold">{s?.business_name ?? "Studio Cleison Cortes"}</p>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="eyebrow">Contato</p>
          {s?.address && (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {s.address}
            </p>
          )}
          <a
            href={whatsappLink(s?.whatsapp || SHOP_WHATSAPP)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-primary"
          >
            <MessageCircle className="size-4 text-primary" /> {s?.phone ?? "(79) 99689-1622"}
          </a>
          {s?.instagram && (
            <a href={s.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary">
              <Instagram className="size-4 text-primary" /> @studiocleisoncortes
            </a>
          )}
        </div>
        {hasOpeningHours(oh) && (
          <div className="space-y-3 text-sm">
            <p className="eyebrow">Horário de funcionamento</p>
            <ul className="space-y-1.5 text-muted-foreground">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const day = oh?.[String(d)];
                const open = day && !day.closed && day.open && day.close;
                return (
                  <li key={d} className="flex justify-between gap-4">
                    <span>{DAY_NAMES[d]}</span>
                    <span className={open ? "text-foreground" : ""}>{open ? `${day.open} – ${day.close}` : "Fechado"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Studio Cleison Cortes. Todos os direitos reservados.</p>
          <Link to="/auth" className="hover:text-primary">
            Área da equipe
          </Link>
        </div>
      </div>
    </footer>
  );
}
