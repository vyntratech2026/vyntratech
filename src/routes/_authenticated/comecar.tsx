import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, Loader2, Store, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLATFORM_NAME } from "@/lib/brand";
import { BUSINESS_TYPES, slugify, slugProblem } from "@/lib/company-slug";
import { errorMessage } from "@/lib/format";
import { useStaff } from "@/lib/use-staff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comecar")({
  head: () => ({
    meta: [
      { title: `Cadastrar sua empresa — ${PLATFORM_NAME}` },
      { name: "description", content: "Crie o site de agendamento da sua empresa." },
      { property: "og:title", content: `Cadastrar sua empresa — ${PLATFORM_NAME}` },
      { property: "og:description", content: "Crie o site de agendamento da sua empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StartPage,
});

function StartPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: staff, isLoading } = useStaff();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [type, setType] = useState<string>("barbearia");

  useEffect(() => {
    if (staff?.companyId) navigate({ to: "/admin", replace: true });
  }, [staff, navigate]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const localProblem = slug ? slugProblem(slug) : "invalid";
  const check = useQuery({
    queryKey: ["slug-check", slug],
    enabled: !!slug && !localProblem,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("slug_problem", { p_slug: slug });
      if (error) throw error;
      return data;
    },
  });
  const problem = localProblem ?? check.data ?? null;
  const ok = !!slug && !problem && !check.isFetching;

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("create_company", { p_name: name.trim(), p_slug: slug, p_type: type });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Empresa criada! Agora cadastre serviços, profissionais e horários.");
      await qc.invalidateQueries({ queryKey: ["staff"] });
      navigate({ to: "/admin", replace: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isLoading || staff?.companyId) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  const origin = typeof window !== "undefined" ? window.location.host : "";
  const message =
    !slug ? "Escolha o link do seu site." :
    problem === "invalid" ? "Use de 3 a 48 letras minúsculas, números ou hífen." :
    problem === "reserved" || problem === "taken" ? "Esse link já está em uso. Escolha outro." :
    check.isFetching ? "Conferindo..." : "Link disponível!";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-96 bg-radial-glow" />
      <div className="relative w-full max-w-md">
        <div className="surface-card p-7">
          <Store className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 text-center text-xl font-bold">Cadastre sua empresa</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Você recebe na hora um site de agendamento e um painel só seus.
          </p>
          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da empresa</Label>
              <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} className="h-11" placeholder="Ex.: Barbearia do João" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de negócio</Label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    aria-pressed={type === t.value}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      type === t.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-slug">Link do seu site</Label>
              <div className="flex items-center overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                <span className="whitespace-nowrap bg-surface-raised px-3 py-2.5 text-xs text-muted-foreground">{origin}/</span>
                <input
                  id="company-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                  maxLength={48}
                />
              </div>
              <p className={cn("flex items-center gap-1 text-xs", ok ? "text-primary" : "text-muted-foreground")}>
                {ok ? <Check className="size-3" /> : slug && problem ? <X className="size-3" /> : null} {message}
              </p>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={!ok || name.trim().length < 2 || create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />} Criar minha empresa
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
