import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/brand";
import { useStaff } from "@/lib/use-staff";
import { errorMessage, formatPrice, todayInShop } from "@/lib/format";
import { packagePeriod } from "@/lib/offers";
import { AdminOnly, PageHeader, EmptyState } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
export const Route = createFileRoute("/_authenticated/admin/ofertas")({
  head: () => ({ meta: [{ title: "Pacotes e promoções — Vyntra Tech" }, { name: "description", content: "Gerencie assinaturas para clientes e promoções de serviços com prazo." }, { property: "og:title", content: "Pacotes e promoções — Vyntra Tech" }, { property: "og:description", content: "Ofertas da sua empresa para clientes." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: OffersPage,
});
type Form = { id?: string; kind: string; name: string; description: string; price: string; period_months: number; benefits: string; service_id: string; start_date: string; end_date: string; is_active: boolean };
function OffersPage() {
  const { id: companyId } = useCompany(); const { data: staff } = useStaff(); const qc = useQueryClient();
  const [kind, setKind] = useState("package"); const [form, setForm] = useState<Form | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const list = useQuery({ queryKey: ["admin", "offers", companyId], queryFn: async () => { const { data, error } = await supabase.from("customer_offers").select("*").eq("company_id", companyId).order("name"); if (error) throw error; return data ?? []; } });
  const services = useQuery({ queryKey: ["admin", "offer-services", companyId], queryFn: async () => { const { data, error } = await supabase.from("services").select("id,name,price").eq("company_id", companyId).eq("is_active", true).order("name"); if (error) throw error; return data ?? []; } });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin"] }); qc.invalidateQueries({ queryKey: ["public"] }); };
  const save = useMutation({ mutationFn: async (f: Form) => {
    const price = Number(f.price.replace(",", ".")); if (!f.name.trim() || !f.price.trim() || !Number.isFinite(price) || price < 0) throw new Error("Informe nome e preço válidos.");
    if (f.kind === "promotion" && (!f.service_id || !f.start_date || !f.end_date || f.end_date < f.start_date)) throw new Error("Escolha serviço e datas válidas.");
    const row = { company_id: companyId, kind: f.kind, name: f.name.trim(), description: f.description, price, period_months: f.period_months, benefits: f.benefits, service_id: f.kind === "promotion" ? f.service_id : null, start_date: f.kind === "promotion" ? f.start_date : null, end_date: f.kind === "promotion" ? f.end_date : null, is_active: f.is_active };
    const { error } = f.id ? await supabase.from("customer_offers").update(row).eq("id", f.id).eq("company_id", companyId) : await supabase.from("customer_offers").insert(row); if (error) throw error;
  }, onSuccess: () => { toast.success("Oferta salva"); setForm(null); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("customer_offers").delete().eq("id", id).eq("company_id", companyId); if (error) throw error; }, onSuccess: () => { setRemoveId(null); refresh(); toast.success("Oferta removida"); }, onError: (e) => toast.error(errorMessage(e)) });
  return <AdminOnly isAdmin={!!staff?.isAdmin}><PageHeader title="Pacotes e promoções" actions={<Button onClick={() => setForm({ kind, name: "", description: "", price: "", period_months: 1, benefits: "", service_id: "", start_date: todayInShop(), end_date: todayInShop(), is_active: true })}><Plus />{kind === "package" ? "Novo pacote" : "Nova promoção"}</Button>} />
    <div className="mb-6 flex gap-2"><Button variant={kind === "package" ? "default" : "outline"} onClick={() => setKind("package")}>Assinaturas de clientes</Button><Button variant={kind === "promotion" ? "default" : "outline"} onClick={() => setKind("promotion")}>Promoções</Button></div>
    {list.isPending ? <Loader2 className="animate-spin" /> : list.isError ? <Button onClick={() => list.refetch()}>Tentar novamente</Button> : !list.data?.some((o) => o.kind === kind) ? <EmptyState text="Nenhuma oferta cadastrada." /> : <ul className="grid gap-3">{list.data.filter((o) => o.kind === kind).map((o) => <li key={o.id} className="surface-card flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-semibold break-words">{o.name}{!o.is_active && " (oculta)"}</p><p className="text-sm text-muted-foreground">{formatPrice(o.price)}{o.kind === "package" ? ` /${packagePeriod(o.period_months)}` : ` · ${o.start_date?.split("-").reverse().join("/")} a ${o.end_date?.split("-").reverse().join("/")}`}</p></div><Button variant="ghost" size="icon" aria-label={`Editar ${o.name}`} onClick={() => setForm({ ...o, price: String(o.price), service_id: o.service_id ?? "", start_date: o.start_date ?? todayInShop(), end_date: o.end_date ?? todayInShop() })}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Excluir ${o.name}`} onClick={() => setRemoveId(o.id)}><Trash2 /></Button></li>)}</ul>}
    <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{form?.kind === "package" ? "Pacote de assinatura" : "Promoção com prazo"}</DialogTitle></DialogHeader>{form && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
      <Label htmlFor="offer-name">Nome</Label><Input id="offer-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Label htmlFor="offer-description">Descrição</Label><Textarea id="offer-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Label htmlFor="offer-price">Preço (R$)</Label><Input id="offer-price" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
      {form.kind === "package" ? <><Label htmlFor="offer-period">Período da assinatura</Label><select id="offer-period" className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.period_months} onChange={(e) => setForm({ ...form, period_months: Number(e.target.value) })}>{[1,3,6,12].map((m) => <option key={m} value={m}>{m === 1 ? "Mensal" : `${m} meses`}</option>)}</select><Label htmlFor="offer-benefits">Serviços incluídos e condições</Label><Textarea id="offer-benefits" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} /></> : <><Label htmlFor="offer-service">Serviço</Label><select id="offer-service" required className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}><option value="">Selecione</option>{services.data?.map((s) => <option key={s.id} value={s.id}>{s.name} · {formatPrice(s.price)}</option>)}</select><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="offer-start">Início</Label><Input id="offer-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div><div><Label htmlFor="offer-end">Fim</Label><Input id="offer-end" type="date" min={form.start_date} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required /></div></div></>}
      <label className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />Publicar no site</label><Button className="w-full" type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />}Salvar oferta</Button>
    </form>}</DialogContent></Dialog>
    <Dialog open={!!removeId} onOpenChange={(open) => !open && setRemoveId(null)}><DialogContent><DialogHeader><DialogTitle>Excluir oferta?</DialogTitle></DialogHeader><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setRemoveId(null)}>Cancelar</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => removeId && remove.mutate(removeId)}>Excluir oferta</Button></div></DialogContent></Dialog>
  </AdminOnly>;
}