import { useCompany } from "@/lib/brand";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly, PageHeader } from "@/components/admin/page-header";
import { PhotoField } from "@/components/admin/fields";
import { BrandName, Logo } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStaff } from "@/lib/use-staff";
import { errorMessage } from "@/lib/format";
import { DEFAULT_BUSINESS_NAME } from "@/lib/brand";
import { contrastRatio, DEFAULT_BRAND, isHexColor, themeVars, type BrandColors } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/admin/aparencia")({
  component: AppearancePage,
});

const PRESETS: { label: string; colors: BrandColors }[] = [
  { label: "Original", colors: DEFAULT_BRAND },
  { label: "Dourado", colors: { primary: "#d4a64a", background: "#0b0a08", text: "#f6f1e7" } },
  { label: "Vermelho", colors: { primary: "#e23b3b", background: "#0a0808", text: "#ffffff" } },
  { label: "Azul", colors: { primary: "#38bdf8", background: "#070a10", text: "#ffffff" } },
];

const COLOR_FIELDS: { key: keyof BrandColors; label: string; hint: string }[] = [
  { key: "primary", label: "Cor de destaque", hint: "Botões, links e brilho" },
  { key: "background", label: "Cor de fundo", hint: "Fundo das páginas" },
  { key: "text", label: "Cor do texto", hint: "Textos e títulos" },
];

function AppearancePage() {
  const companyId = useCompany().id;
  const { data: staff } = useStaff();
  const qc = useQueryClient();
  const router = useRouter();
  const q = useQuery({
    queryKey: ["admin", "appearance"],
    enabled: !!staff?.isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("business_name, logo_url, brand_primary, brand_background, brand_text")
        .eq("company_id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [colors, setColors] = useState<BrandColors>(DEFAULT_BRAND);
  const [drafts, setDrafts] = useState<BrandColors>(DEFAULT_BRAND);

  useEffect(() => {
    if (!q.data) return;
    const c = { primary: q.data.brand_primary, background: q.data.brand_background, text: q.data.brand_text };
    setName(q.data.business_name);
    setLogo(q.data.logo_url);
    setColors(c);
    setDrafts(c);
  }, [q.data]);

  const setColor = (key: keyof BrandColors, value: string) => {
    setDrafts((d) => ({ ...d, [key]: value }));
    if (isHexColor(value)) setColors((c) => ({ ...c, [key]: value.toLowerCase() }));
  };
  const applyPreset = (c: BrandColors) => {
    setColors(c);
    setDrafts(c);
  };

  const textContrast = contrastRatio(colors.text, colors.background);
  const accentContrast = contrastRatio(colors.primary, colors.background);
  const warnings = [
    textContrast < 4.5 && "O texto ficará difícil de ler sobre essa cor de fundo.",
    accentContrast < 2 && "A cor de destaque quase some sobre essa cor de fundo.",
  ].filter(Boolean) as string[];

  const save = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (trimmed.length < 2) throw new Error("Informe o nome da empresa.");
      if (trimmed.length > 60) throw new Error("O nome pode ter no máximo 60 letras.");
      const { error } = await supabase
        .from("settings")
        .update({
          business_name: trimmed,
          logo_url: logo,
          brand_primary: colors.primary,
          brand_background: colors.background,
          brand_text: colors.text,
        })
        .eq("company_id", companyId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await router.invalidate();
      qc.invalidateQueries({ queryKey: ["admin", "appearance"] });
      qc.invalidateQueries({ queryKey: ["public"] });
      toast.success("Aparência salva. O site já está com o novo visual.");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const previewName = name.trim() || DEFAULT_BUSINESS_NAME;

  return (
    <AdminOnly isAdmin={!!staff?.isAdmin}>
      <PageHeader
        title="Aparência"
        subtitle="Troque a logo, o nome e as cores do site e do painel."
        actions={
          <Button onClick={() => save.mutate()} disabled={!q.data || save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Salvar
          </Button>
        }
      />
      {!q.data ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface" />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="surface-card space-y-4 p-5 sm:p-6">
              <h2 className="text-base font-semibold">Logo</h2>
              <PhotoField value={logo} onChange={setLogo} folder="logo" className="size-20 rounded-full" label="Logo" />
              {!logo && <p className="text-xs text-muted-foreground">Sem logo enviada, o site usa a logo original.</p>}
            </section>

            <section className="surface-card space-y-4 p-5 sm:p-6">
              <h2 className="text-base font-semibold">Nome</h2>
              <div className="space-y-2">
                <Label htmlFor="brand-name">Nome da empresa</Label>
                <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
                <p className="text-xs text-muted-foreground">A última palavra aparece na cor de destaque.</p>
              </div>
            </section>

            <section className="surface-card space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Cores</h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => applyPreset(DEFAULT_BRAND)}>
                  <RotateCcw /> Voltar às cores originais
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.colors)}
                    className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/60"
                  >
                    <span className="flex">
                      {[p.colors.background, p.colors.primary, p.colors.text].map((c) => (
                        <span key={c} className="-ml-1 size-4 rounded-full border border-border first:ml-0" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {COLOR_FIELDS.map((cf) => (
                  <div key={cf.key} className="space-y-2">
                    <Label htmlFor={`color-${cf.key}`}>{cf.label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label={cf.label}
                        value={colors[cf.key]}
                        onChange={(e) => setColor(cf.key, e.target.value)}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
                      />
                      <Input
                        id={`color-${cf.key}`}
                        value={drafts[cf.key]}
                        onChange={(e) => setColor(cf.key, e.target.value.trim())}
                        maxLength={7}
                        className="font-mono uppercase"
                        aria-invalid={!isHexColor(drafts[cf.key])}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{cf.hint}</p>
                  </div>
                ))}
              </div>
              {warnings.map((w) => (
                <p key={w} className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {w}
                </p>
              ))}
            </section>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-8 lg:self-start">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Prévia</p>
            <div
              style={themeVars(colors) as React.CSSProperties}
              className="overflow-hidden rounded-xl border border-border bg-background text-foreground"
            >
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Logo path={logo} className="size-9" />
                <span className="truncate font-display text-xs font-semibold uppercase tracking-wider">
                  <BrandName name={previewName} />
                </span>
              </div>
              <div className="space-y-4 bg-radial-glow p-5">
                <p className="eyebrow">Bem-vindo</p>
                <h3 className="font-display text-2xl font-bold leading-tight">
                  <BrandName name={previewName} accentClassName="text-glow" />
                </h3>
                <p className="text-sm text-muted-foreground">Escolha o serviço, o profissional e o horário.</p>
                <div className="flex gap-2">
                  <span className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">Agendar</span>
                  <span className="rounded-lg border border-input px-4 py-2 text-sm">WhatsApp</span>
                </div>
                <div className="surface-card p-3">
                  <p className="text-sm font-semibold">Corte</p>
                  <p className="text-sm font-bold text-primary">R$ 40,00</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </AdminOnly>
  );
}
