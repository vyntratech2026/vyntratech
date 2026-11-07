import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStaff } from "@/lib/use-staff";
import { formatDate, formatPhone, formatPrice, formatTime, normalizePhone, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: CustomersPage,
});

function CustomersPage() {
  const { data: staff } = useStaff();
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, phone, created_at, appointments!appointments_customer_id_fkey(start_at, status)")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const t = term.trim().toLowerCase();
  const digits = normalizePhone(term);
  const filtered =
    list.data?.filter((c) => !t || c.full_name.toLowerCase().includes(t) || (digits.length >= 3 && c.phone.includes(digits))) ?? [];

  return (
    <>
      <PageHeader title={staff?.isAdmin ? "Clientes" : "Meus clientes"} subtitle="Cadastrados automaticamente no primeiro agendamento." />
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar por nome ou telefone" className="pl-9" />
      </div>
      {list.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : !filtered.length ? (
        <EmptyState text={list.data?.length ? "Nenhum cliente encontrado." : "Nenhum cliente ainda."} />
      ) : (
        <ul className="surface-card divide-y divide-border">
          {filtered.map((c) => {
            const done = c.appointments.filter((a) => a.status === "completed");
            const first = done.map((a) => a.start_at).sort()[0];
            return (
              <li key={c.id}>
                <button onClick={() => setSelected(c.id)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-surface-raised">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground">{formatPhone(c.phone)}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{done.length} atendimento(s)</p>
                    <p>{first ? `desde ${formatDate(first)}` : "ainda sem atendimento"}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <CustomerDetail id={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function CustomerDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const q = useQuery({
    queryKey: ["admin", "customer", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, phone, created_at, appointments!appointments_customer_id_fkey(id, start_at, service_name, price, status, barbers!appointments_barber_id_fkey(name))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const c = q.data;
  const history = [...(c?.appointments ?? [])].sort((a, b) => b.start_at.localeCompare(a.start_at));
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{c?.full_name ?? "Cliente"}</DialogTitle>
        </DialogHeader>
        {c && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{formatPhone(c.phone)}</p>
              <Button asChild size="sm" variant="secondary">
                <a href={whatsappLink(`55${c.phone}`)} target="_blank" rel="noreferrer">
                  <MessageCircle /> WhatsApp
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Cliente desde {formatDate(c.created_at)}</p>
            <h3 className="pt-2 text-sm font-semibold">Histórico</h3>
            {!history.length ? (
              <p className="text-sm text-muted-foreground">Sem agendamentos.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {history.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.service_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.start_at)} {formatTime(a.start_at)} · {a.barbers?.name} · {formatPrice(a.price)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
