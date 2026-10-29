import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly, EmptyState, PageHeader } from "@/components/admin/page-header";
import { PhotoField } from "@/components/admin/fields";
import { MediaImage } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStaff } from "@/lib/use-staff";
import { errorMessage, formatDuration, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/servicos")({
  component: ServicesPage,
});

interface ServiceForm {
  id?: string;
  name: string;
  description: string;
  photo_url: string | null;
  price: string;
  duration_minutes: string;
  is_active: boolean;
}

const EMPTY: ServiceForm = { name: "", description: "", photo_url: null, price: "", duration_minutes: "30", is_active: true };

function ServicesPage() {
  const { data: staff } = useStaff();
  const qc = useQueryClient();
  const [form, setForm] = useState<ServiceForm | null>(null);

  const list = useQuery({
    queryKey: ["admin", "services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (f: ServiceForm) => {
      const price = Number(f.price.replace(",", "."));
      const duration = Number(f.duration_minutes);
      if (f.name.trim().length < 2) throw new Error("Informe o nome do serviço.");
      if (!Number.isFinite(price) || price < 0) throw new Error("Preço inválido.");
      if (!Number.isInteger(duration) || duration < 5 || duration > 480) throw new Error("Duração deve ser entre 5 e 480 minutos.");
      const row = {
        name: f.name.trim(),
        description: f.description.trim() || null,
        photo_url: f.photo_url,
        price,
        duration_minutes: duration,
        is_active: f.is_active,
      };
      const { error } = f.id
        ? await supabase.from("services").update(row).eq("id", f.id)
        : await supabase.from("services").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Serviço salvo");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
      qc.invalidateQueries({ queryKey: ["public"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) {
        if (error.code === "23503") throw new Error("Este serviço já tem agendamentos. Desative-o em vez de excluir.");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Serviço excluído");
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <AdminOnly isAdmin={!!staff?.isAdmin}>
      <PageHeader
        title="Serviços"
        subtitle="Mudar o preço não altera agendamentos já feitos."
        actions={
          <Button onClick={() => setForm({ ...EMPTY })}>
            <Plus /> Novo serviço
          </Button>
        }
      />
      {list.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : !list.data?.length ? (
        <EmptyState text="Nenhum serviço cadastrado ainda." action={<Button onClick={() => setForm({ ...EMPTY })}>Cadastrar primeiro serviço</Button>} />
      ) : (
        <ul className="grid gap-3">
          {list.data.map((s) => (
            <li key={s.id} className="surface-card flex items-center gap-4 p-3">
              <MediaImage path={s.photo_url} alt={s.name} className="size-16 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {s.name} {!s.is_active && <span className="ml-2 text-xs font-normal text-muted-foreground">(inativo)</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(s.price)} · {formatDuration(s.duration_minutes)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                onClick={() =>
                  setForm({
                    id: s.id,
                    name: s.name,
                    description: s.description ?? "",
                    photo_url: s.photo_url,
                    price: String(s.price),
                    duration_minutes: String(s.duration_minutes),
                    is_active: s.is_active,
                  })
                }
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir"
                onClick={() => confirm(`Excluir o serviço "${s.name}"?`) && remove.mutate(s.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          </DialogHeader>
          {form && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(form);
              }}
            >
              <PhotoField value={form.photo_url} onChange={(p) => setForm({ ...form, photo_url: p })} folder="services" />
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input type="number" min={5} max={480} step={5} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} required />
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> Ativo (aparece no site)
              </label>
              <p className="text-xs text-muted-foreground">Depois de salvar, marque quais barbeiros fazem este serviço na página Barbeiros.</p>
              <Button type="submit" className="w-full" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />} Salvar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminOnly>
  );
}
