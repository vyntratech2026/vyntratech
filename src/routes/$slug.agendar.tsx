import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Calendar, Check, Clock, Loader2, MessageCircle, Scissors, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo, MediaImage } from "@/components/site/brand";
import { barberServicesQuery, barbersQuery, servicesQuery, settingsQuery } from "@/lib/public-data";
import {
  addDaysKey,
  bookingWhatsappMessage,
  dayOfWeekFromKey,
  errorMessage,
  formatDuration,
  formatLongDate,
  formatPhone,
  formatPrice,
  formatTime,
  isValidPhone,
  SHOP_WHATSAPP,
  todayInShop,
  whatsappLink,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { notifyNewBooking } from "@/lib/notifications.functions";
import { useBrand } from "@/lib/brand";

const searchSchema = z.object({
  servico: z.string().uuid().optional().catch(undefined),
  barbeiro: z.string().uuid().optional().catch(undefined),
});

export const Route = createFileRoute("/$slug/agendar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Agendar horário — Studio Cleison Cortes" },
      { name: "description", content: "Escolha serviço, barbeiro, dia e horário no Studio Cleison Cortes, em Aracaju." },
      { property: "og:title", content: "Agendar horário — Studio Cleison Cortes" },
      { property: "og:description", content: "Agende seu corte online em poucos passos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingPage,
});

const STEPS = ["Serviço", "Barbeiro", "Horário", "Seus dados", "Revisão"];

interface BookingResult {
  token: string;
  service_name: string;
  barber_name: string;
  start_at: string;
  price: number;
  duration_minutes: number;
  customer_name: string;
}

function BookingPage() {
  const search = Route.useSearch();
  const { data: settings } = useQuery(settingsQuery());
  const { data: services, isLoading: loadingServices } = useQuery(servicesQuery());
  const { data: barbers } = useQuery(barbersQuery());
  const { data: links } = useQuery(barberServicesQuery());

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | undefined>(search.servico);
  const [barberId, setBarberId] = useState<string | undefined>(search.barbeiro);
  const [dateKey, setDateKey] = useState<string | undefined>();
  const [slot, setSlot] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);

  useEffect(() => {
    if (search.servico && step === 0) setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const service = services?.find((s) => s.id === serviceId);
  const barber = barbers?.find((b) => b.id === barberId);

  const visibleServices = useMemo(() => {
    if (!services) return [];
    if (!search.barbeiro) return services;
    return services.filter((s) => links?.some((l) => l.barber_id === search.barbeiro && l.service_id === s.id));
  }, [services, links, search.barbeiro]);

  const serviceBarbers = useMemo(
    () => barbers?.filter((b) => links?.some((l) => l.barber_id === b.id && l.service_id === serviceId)) ?? [],
    [barbers, links, serviceId],
  );

  const days = useMemo(() => {
    const today = todayInShop();
    const max = Math.min(settings?.max_advance_days ?? 30, 60);
    const oh = settings?.opening_hours ?? {};
    const out: string[] = [];
    for (let i = 0; i <= max; i++) {
      const key = addDaysKey(today, i);
      const d = oh[String(dayOfWeekFromKey(key))];
      if (d && !d.closed && d.open && d.close) out.push(key);
    }
    return out;
  }, [settings]);

  const slotsQuery = useQuery({
    queryKey: ["slots", serviceId, barberId, dateKey],
    enabled: !!serviceId && !!barberId && !!dateKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_service_id: serviceId!,
        p_date: dateKey!,
        p_barber_id: barberId!,
      });
      if (error) throw error;
      return data;
    },
  });

  const book = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_booking", {
        p_service_id: serviceId!,
        p_barber_id: barberId!,
        p_start_at: slot!,
        p_full_name: name.trim(),
        p_phone: phone,
      });
      if (error) throw error;
      return data as unknown as BookingResult;
    },
    onSuccess: (data) => {
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (data?.token) notifyNewBooking({ data: { token: data.token } }).catch(() => {});
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      if (/ocupado|disponível/i.test(errorMessage(err))) {
        setSlot(undefined);
        setStep(2);
        slotsQuery.refetch();
      }
    },
  });

  if (result) return <BookingDone result={result} whatsapp={settings?.whatsapp || SHOP_WHATSAPP} />;

  const nameOk = name.trim().length >= 2;
  const phoneOk = isValidPhone(phone);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          {step === 0 ? (
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="size-4" /> Início
            </Link>
          ) : (
            <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="size-4" /> Voltar
            </button>
          )}
          <Logo className="size-9" />
        </div>
        <div className="mx-auto flex max-w-3xl gap-1.5 px-4 pb-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={cn("h-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
              <p className={cn("mt-1.5 hidden text-[11px] sm:block", i === step ? "text-primary" : "text-muted-foreground")}>{label}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8">
        {step === 0 && (
          <section className="animate-fade-up space-y-5">
            <h1 className="text-2xl font-bold sm:text-3xl">Escolha o serviço</h1>
            {loadingServices ? (
              <LoadingList />
            ) : visibleServices.length === 0 ? (
              <Empty text="Os serviços ainda estão sendo cadastrados. Fale com a barbearia pelo WhatsApp." />
            ) : (
              <div className="grid gap-3">
                {visibleServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServiceId(s.id);
                      if (barberId && !links?.some((l) => l.barber_id === barberId && l.service_id === s.id)) setBarberId(undefined);
                      setSlot(undefined);
                      setStep(1);
                    }}
                    className={cn(
                      "surface-card flex items-center gap-4 p-3 text-left transition-all hover:border-primary/50",
                      serviceId === s.id && "border-primary shadow-glow",
                    )}
                  >
                    <MediaImage path={s.photo_url} alt={s.name} className="size-20 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{s.name}</p>
                      {s.description && <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                      <p className="mt-1 flex items-center gap-3 text-sm">
                        <span className="font-bold text-primary">{formatPrice(s.price)}</span>
                        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3.5" />{formatDuration(s.duration_minutes)}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="animate-fade-up space-y-5">
            <h1 className="text-2xl font-bold sm:text-3xl">Escolha o barbeiro</h1>
            {serviceBarbers.length === 0 ? (
              <Empty text="Nenhum barbeiro faz este serviço no momento." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {serviceBarbers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBarberId(b.id);
                      setSlot(undefined);
                      setStep(2);
                    }}
                    className={cn(
                      "surface-card flex items-center gap-4 p-3 text-left transition-all hover:border-primary/50",
                      barberId === b.id && "border-primary shadow-glow",
                    )}
                  >
                    <MediaImage path={b.photo_url} alt={b.name} className="size-16 shrink-0 rounded-full" />
                    <div className="min-w-0">
                      <p className="font-semibold">{b.name}</p>
                      {!!b.specialties?.length && <p className="truncate text-xs text-primary">{b.specialties.join(" · ")}</p>}
                      {b.description && <p className="line-clamp-2 text-xs text-muted-foreground">{b.description}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="animate-fade-up space-y-6">
            <h1 className="text-2xl font-bold sm:text-3xl">Escolha dia e horário</h1>
            {days.length === 0 ? (
              <Empty text="A agenda online ainda não está aberta. Fale com a barbearia pelo WhatsApp." />
            ) : (
              <>
                <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">
                  {days.map((k) => {
                    const d = new Date(`${k}T12:00:00-03:00`);
                    const active = k === dateKey;
                    return (
                      <button
                        key={k}
                        onClick={() => {
                          setDateKey(k);
                          setSlot(undefined);
                        }}
                        className={cn(
                          "flex w-16 shrink-0 snap-start flex-col items-center rounded-xl border px-2 py-3 transition-all",
                          active ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-surface hover:border-primary/50",
                        )}
                      >
                        <span className="text-[11px] uppercase opacity-80">
                          {new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "America/Maceio" }).format(d).replace(".", "")}
                        </span>
                        <span className="font-display text-xl font-bold">{k.slice(8)}</span>
                        <span className="text-[11px] opacity-80">
                          {new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "America/Maceio" }).format(d).replace(".", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!dateKey ? (
                  <p className="text-sm text-muted-foreground">Selecione um dia para ver os horários livres de {barber?.name}.</p>
                ) : slotsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Buscando horários…</div>
                ) : slotsQuery.isError ? (
                  <Empty text="Não foi possível carregar os horários. Tente novamente." />
                ) : !slotsQuery.data?.length ? (
                  <Empty text={`${barber?.name ?? "O barbeiro"} não tem horários livres neste dia. Escolha outro dia.`} />
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slotsQuery.data.map((s) => (
                      <button
                        key={s.slot_start}
                        onClick={() => {
                          setSlot(s.slot_start);
                          setStep(3);
                        }}
                        className={cn(
                          "rounded-lg border py-3 font-semibold transition-all",
                          slot === s.slot_start ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/60",
                        )}
                      >
                        {formatTime(s.slot_start)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="animate-fade-up space-y-6">
            <h1 className="text-2xl font-bold sm:text-3xl">Seus dados</h1>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (nameOk && phoneOk) setStep(4);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="h-12" placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => phoneOk && setPhone(formatPhone(phone))}
                  className="h-12"
                  placeholder="(79) 90000-0000"
                />
                {phone && !phoneOk && <p className="text-xs text-destructive">Informe DDD + número.</p>}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={!nameOk || !phoneOk}>
                Continuar
              </Button>
            </form>
          </section>
        )}

        {step === 4 && service && barber && slot && (
          <section className="animate-fade-up space-y-6">
            <h1 className="text-2xl font-bold sm:text-3xl">Revise seu agendamento</h1>
            <div className="surface-card divide-y divide-border">
              <Row icon={<Scissors />} label="Serviço" value={service.name} />
              <Row icon={<User />} label="Barbeiro" value={barber.name} />
              <Row icon={<Calendar />} label="Data" value={formatLongDate(slot)} />
              <Row icon={<Clock />} label="Horário" value={`${formatTime(slot)} · ${formatDuration(service.duration_minutes)}`} />
              <Row icon={<User />} label="Cliente" value={`${name.trim()} · ${formatPhone(phone)}`} />
              <div className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-display text-2xl font-bold text-primary">{formatPrice(service.price)}</span>
              </div>
            </div>
            {settings?.cancellation_min_hours != null && (
              <p className="text-xs text-muted-foreground">
                Você poderá cancelar pelo link do agendamento até {settings.cancellation_min_hours}h antes do horário.
              </p>
            )}
            <Button variant="hero" size="xl" className="w-full" disabled={book.isPending} onClick={() => book.mutate()}>
              {book.isPending ? <Loader2 className="animate-spin" /> : <Check />} Confirmar agendamento
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 [&_svg]:size-4 [&_svg]:text-primary">
      {icon}
      <span className="w-20 text-sm text-muted-foreground">{label}</span>
      <span className="flex-1 text-right font-medium">{value}</span>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function BookingDone({ result, whatsapp }: { result: BookingResult; whatsapp: string }) {
  const brand = useBrand();
  const msg = bookingWhatsappMessage({
    customerName: result.customer_name,
    serviceName: result.service_name,
    barberName: result.barber_name,
    startAt: result.start_at,
    price: result.price,
    businessName: brand.name,
  });
  const manageUrl = typeof window !== "undefined" ? `${window.location.origin}/agendamento/${result.token}` : "";
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-x-0 top-0 h-96 bg-radial-glow" />
      <main className="relative mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex size-20 animate-glow-pulse items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-10" strokeWidth={3} />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Horário confirmado!</h1>
        <p className="mt-2 text-muted-foreground">
          {result.service_name} com {result.barber_name}
          <br />
          <span className="capitalize text-foreground">{formatLongDate(result.start_at)}</span> às{" "}
          <span className="text-foreground">{formatTime(result.start_at)}</span> · {formatPrice(result.price)}
        </p>

        <div className="mt-8 space-y-3">
          <Button asChild variant="hero" size="xl" className="w-full">
            <a href={whatsappLink(whatsapp, msg)} target="_blank" rel="noreferrer">
              <MessageCircle /> Enviar detalhes pelo WhatsApp
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            O WhatsApp abre com a mensagem pronta. Ela só chega à barbearia depois que você tocar em enviar.
          </p>
        </div>

        <div className="surface-card mt-8 space-y-3 p-5 text-left">
          <p className="text-sm font-semibold">Guarde o link do seu agendamento</p>
          <p className="text-xs text-muted-foreground">Por ele você pode cancelar e, depois do atendimento, deixar sua avaliação.</p>
          <div className="flex gap-2">
            <Input readOnly value={manageUrl} className="text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(manageUrl).then(() => toast.success("Link copiado"));
              }}
            >
              Copiar
            </Button>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/agendamento/$token" params={{ token: result.token }}>
              Abrir meu agendamento
            </Link>
          </Button>
        </div>

        <Button asChild variant="link" className="mt-6">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </main>
    </div>
  );
}
