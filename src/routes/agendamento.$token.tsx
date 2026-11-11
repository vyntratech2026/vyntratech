import { CompanyProvider, type CompanyInfo } from "@/lib/brand";
import { themeCss } from "@/lib/theme";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Calendar, Clock, Loader2, MessageCircle, Scissors, Star, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Logo } from "@/components/site/brand";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  errorMessage,
  formatDuration,
  formatLongDate,
  formatPrice,
  formatTime,
  whatsappLink,
  type AppointmentStatus,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { GoogleReviewButton } from "@/components/site/google-review-button";
import { bookingGoogleReviewUrl } from "@/lib/google-review";

export const Route = createFileRoute("/agendamento/$token")({
  head: () => ({
    meta: [
      { title: "Meu agendamento — Vyntra Tech" },
      { name: "description", content: "Veja, cancele ou avalie seu atendimento na Vyntra Tech." },
      { property: "og:title", content: "Meu agendamento — Vyntra Tech" },
      { property: "og:description", content: "Veja, cancele ou avalie seu atendimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManageBooking,
});

interface Booking {
  service_name: string;
  barber_name: string;
  customer_name: string;
  start_at: string;
  duration_minutes: number;
  price: number;
  status: AppointmentStatus;
  has_review: boolean;
  can_cancel: boolean;
  can_review: boolean;
  cancellation_min_hours: number;
  company_slug: string;
  business_name: string;
  whatsapp: string | null;
  logo_url: string | null;
  brand_primary: string;
  brand_background: string;
  brand_text: string;
  google_review_url: string | null;
}

function ManageBooking() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const validToken = z.string().uuid().safeParse(token).success;

  const q = useQuery({
    queryKey: ["booking", token],
    enabled: validToken,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_booking", { p_token: token });
      if (error) throw error;
      return data as unknown as Booking | null;
    },
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("cancel_booking", { p_token: token });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado. O horário foi liberado.");
      qc.invalidateQueries({ queryKey: ["booking", token] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const b = q.data;
  const company: CompanyInfo | null = b
    ? {
        id: "",
        slug: b.company_slug,
        brand: {
          name: b.business_name,
          logoPath: b.logo_url,
          colors: { primary: b.brand_primary, background: b.brand_background, text: b.brand_text },
        },
      }
    : null;
  const css = company ? themeCss(company.brand.colors) : "";

  const page = (
    <div className="relative min-h-screen bg-background">
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <div className="absolute inset-x-0 top-0 h-80 bg-radial-glow" />
      <main className="relative mx-auto max-w-lg px-4 py-12">
        {company ? (
          <Link to="/$slug" params={{ slug: company.slug }} className="mx-auto block w-fit">
            <Logo className="size-16" />
          </Link>
        ) : (
          <Logo className="mx-auto size-16" />
        )}
        <h1 className="mt-6 text-center text-2xl font-bold">Meu agendamento</h1>

        {!validToken || (q.isSuccess && !b) ? (
          <p className="mt-8 text-center text-muted-foreground">Agendamento não encontrado. Confira o link.</p>
        ) : q.isLoading ? (
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-surface" />
        ) : b ? (
          <div className="mt-8 space-y-6">
            <div className="surface-card divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-muted-foreground">Olá, {b.customer_name.split(" ")[0]}</span>
                <StatusBadge status={b.status} />
              </div>
              <Line icon={<Scissors />} label="Serviço" value={b.service_name} />
              <Line icon={<User />} label="Barbeiro" value={b.barber_name} />
              <Line icon={<Calendar />} label="Data" value={formatLongDate(b.start_at)} />
              <Line icon={<Clock />} label="Horário" value={`${formatTime(b.start_at)} · ${formatDuration(b.duration_minutes)}`} />
              <div className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-display text-xl font-bold text-primary">{formatPrice(b.price)}</span>
              </div>
            </div>

            {b.can_cancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Cancelar agendamento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar este horário?</AlertDialogTitle>
                    <AlertDialogDescription>O horário será liberado para outra pessoa. Essa ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Manter</AlertDialogCancel>
                    <AlertDialogAction onClick={() => cancel.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Sim, cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {!b.can_cancel && (b.status === "pending" || b.status === "confirmed") && (
              <p className="text-center text-xs text-muted-foreground">
                Cancelamento pelo site só até {b.cancellation_min_hours}h antes. Fale com o estabelecimento{b.whatsapp ? ":" : "."}
                {b.whatsapp && <a href={whatsappLink(b.whatsapp)} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 text-primary">
                  <MessageCircle className="size-3" /> WhatsApp
                </a>}
              </p>
            )}

            {b.can_review && <ReviewForm token={token} onDone={() => qc.invalidateQueries({ queryKey: ["booking", token] })} />}
            {b.has_review && <p className="text-center text-sm text-primary">Obrigado pela sua avaliação!</p>}
            <GoogleReviewButton url={bookingGoogleReviewUrl(b.status, b.google_review_url)} className="w-full" />

            <Button asChild variant="hero" size="lg" className="w-full">
              <Link to="/$slug/agendar" params={{ slug: b.company_slug }}>Fazer novo agendamento</Link>
            </Button>
          </div>
        ) : (
          <p className="mt-8 text-center text-muted-foreground">Não foi possível carregar. Tente novamente.</p>
        )}
      </main>
    </div>
  );
  return company ? <CompanyProvider company={company}>{page}</CompanyProvider> : page;
}

function Line({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 [&_svg]:size-4 [&_svg]:text-primary">
      {icon}
      <span className="w-20 text-sm text-muted-foreground">{label}</span>
      <span className="flex-1 text-right font-medium">{value}</span>
    </div>
  );
}

function ReviewForm({ token, onDone }: { token: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("submit_review", {
        p_token: token,
        p_rating: rating,
        p_comment: comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação enviada! Ela aparece no site após aprovação.");
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="surface-card space-y-4 p-5">
      <p className="font-semibold">Como foi seu atendimento?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} estrelas`} className="p-1">
            <Star className={cn("size-8 transition-colors", n <= rating ? "fill-primary text-primary" : "text-muted-foreground")} />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="Conte como foi (opcional)" rows={3} />
      <Button className="w-full" disabled={rating === 0 || send.isPending} onClick={() => send.mutate()}>
        {send.isPending && <Loader2 className="animate-spin" />} Enviar avaliação
      </Button>
    </div>
  );
}
