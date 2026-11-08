import { useCompany } from "@/lib/brand";
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
import { errorMessage, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: ProductsPage,
});

interface ProductForm {
  id?: string;
  name: string;
  description: string;
  photo_url: string | null;
  price: string;
  is_available: boolean;
}

const EMPTY: ProductForm = { name: "", description: "", photo_url: null, price: "", is_available: true };

function ProductsPage() {
  const companyId = useCompany().id;
  const { data: staff } = useStaff();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProductForm | null>(null);

  const list = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("company_id", companyId).order("name");
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["public", "products"] });
  };

  const save = useMutation({
    mutationFn: async (f: ProductForm) => {
      const price = Number(f.price.replace(",", "."));
      if (f.name.trim().length < 2) throw new Error("Informe o nome do produto.");
      if (!Number.isFinite(price) || price < 0) throw new Error("Preço inválido.");
      const row = { name: f.name.trim(), description: f.description.trim() || null, photo_url: f.photo_url, price, is_available: f.is_available };
      const { error } = f.id ? await supabase.from("products").update(row).eq("id", f.id) : await supabase.from("products").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto salvo");
      setForm(null);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: boolean }) => {
      const { error } = await supabase.from("products").update({ is_available: v }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <AdminOnly isAdmin={!!staff?.isAdmin}>
      <PageHeader
        title="Produtos"
        subtitle="Catálogo exibido no site (sem venda online)."
        actions={
          <Button onClick={() => setForm({ ...EMPTY })}>
            <Plus /> Novo produto
          </Button>
        }
      />
      {list.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : !list.data?.length ? (
        <EmptyState text="Nenhum produto cadastrado. A seção Produtos fica oculta no site até ter algum." />
      ) : (
        <ul className="grid gap-3">
          {list.data.map((p) => (
            <li key={p.id} className="surface-card flex items-center gap-4 p-3">
              <MediaImage path={p.photo_url} alt={p.name} className="size-16 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(p.price)}</p>
              </div>
              <label className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <Switch checked={p.is_available} onCheckedChange={(v) => toggle.mutate({ id: p.id, v })} /> Disponível
              </label>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                onClick={() => setForm({ id: p.id, name: p.name, description: p.description ?? "", photo_url: p.photo_url, price: String(p.price), is_available: p.is_available })}
              >
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => confirm(`Excluir "${p.name}"?`) && remove.mutate(p.id)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          {form && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(form);
              }}
            >
              <PhotoField value={form.photo_url} onChange={(p) => setForm({ ...form, photo_url: p })} folder="products" />
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} /> Disponível
              </label>
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
