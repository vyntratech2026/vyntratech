import { useCompany } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, EyeOff, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly, EmptyState, PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { useStaff } from "@/lib/use-staff";
import { errorMessage, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/avaliacoes")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const companyId = useCompany().id;
  const { data: staff } = useStaff();
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, reviewer_name, rating, comment, is_approved, created_at, barbers!reviews_barber_id_fkey(name), appointments!reviews_appointment_id_fkey(service_name, start_at)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.from("reviews").update({ is_approved: approve }).eq("id", id);
      if (error) throw error;
      return approve;
    },
    onSuccess: (approve) => {
      toast.success(approve ? "Avaliação publicada no site" : "Avaliação ocultada do site");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      qc.invalidateQueries({ queryKey: ["public", "reviews"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação excluída");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const pending = list.data?.filter((r) => !r.is_approved).length ?? 0;

  return (
    <AdminOnly isAdmin={!!staff?.isAdmin}>
      <PageHeader
        title="Avaliações"
        subtitle={pending ? `${pending} aguardando sua aprovação. Só as aprovadas aparecem no site.` : "Só as aprovadas aparecem no site."}
      />
      {list.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : !list.data?.length ? (
        <EmptyState text="Nenhuma avaliação ainda. Depois de concluir um atendimento, envie ao cliente o 'Link do cliente' (em Agendamentos) para ele avaliar." />
      ) : (
        <ul className="space-y-3">
          {list.data.map((r) => (
            <li key={r.id} className="surface-card space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < r.rating ? "size-4 fill-primary text-primary" : "size-4 text-muted"} />
                    ))}
                  </div>
                  <span className="font-semibold">{r.reviewer_name}</span>
                </div>
                <span className={r.is_approved ? "text-xs font-semibold text-primary" : "text-xs font-semibold text-warning"}>
                  {r.is_approved ? "Publicada" : "Aguardando aprovação"}
                </span>
              </div>
              {r.comment && <p className="text-sm text-foreground/85">“{r.comment}”</p>}
              <p className="text-xs text-muted-foreground">
                {r.appointments?.service_name} com {r.barbers?.name ?? "—"} · atendimento em{" "}
                {r.appointments?.start_at ? formatDate(r.appointments.start_at) : "—"} · avaliado em {formatDate(r.created_at)}
              </p>
              <div className="flex gap-2 border-t border-border pt-3">
                {r.is_approved ? (
                  <Button size="sm" variant="secondary" onClick={() => update.mutate({ id: r.id, approve: false })}>
                    <EyeOff /> Ocultar
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => update.mutate({ id: r.id, approve: true })}>
                    <Check /> Aprovar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => confirm("Excluir esta avaliação?") && remove.mutate(r.id)}>
                  <Trash2 /> Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminOnly>
  );
}
