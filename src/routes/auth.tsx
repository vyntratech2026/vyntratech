import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/brand";
import { errorMessage, formatPhone, isValidPhone } from "@/lib/format";
import { staffEmailFromPhone } from "@/lib/staff-auth";
import { setupFirstAdmin } from "@/lib/staff.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Área da equipe — Studio Cleison Cortes" },
      { name: "description", content: "Acesso restrito da equipe do Studio Cleison Cortes." },
      { property: "og:title", content: "Área da equipe — Studio Cleison Cortes" },
      { property: "og:description", content: "Acesso restrito da equipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const setupFn = useServerFn(setupFirstAdmin);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const adminExists = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_exists");
      if (error) throw error;
      return data;
    },
  });
  const isSetup = adminExists.data === false;

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: staffEmailFromPhone(phone),
      password,
    });
    if (error) throw new Error(/invalid/i.test(error.message) ? "Celular ou senha incorretos." : error.message);
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!isValidPhone(phone)) throw new Error("Informe o celular com DDD.");
      if (isSetup) {
        await setupFn({ data: { name, phone, password } });
        adminExists.refetch();
      }
      await signIn();
    },
    onSuccess: () => navigate({ to: "/admin", replace: true }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-x-0 top-0 h-96 bg-radial-glow" />
      <div className="relative w-full max-w-sm">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar ao site
        </Link>
        <div className="surface-card p-7">
          <Logo className="mx-auto size-20" />
          <h1 className="mt-5 text-center text-xl font-bold">{isSetup ? "Criar acesso do administrador" : "Área da equipe"}</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {isSetup ? "Primeiro acesso: cadastre o dono da barbearia." : "Entre com seu celular e senha."}
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            {isSetup && (
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="h-11" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Celular</Label>
              <Input
                id="phone"
                inputMode="tel"
                autoComplete="username"
                placeholder="(79) 90000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => isValidPhone(phone) && setPhone(formatPhone(phone))}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSetup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSetup ? 8 : 1}
                className="h-11"
              />
              {isSetup && <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={submit.isPending || adminExists.isLoading}>
              {submit.isPending && <Loader2 className="animate-spin" />}
              {isSetup ? "Criar e entrar" : "Entrar"}
            </Button>
          </form>
          {!isSetup && (
            <p className="mt-5 text-center text-xs text-muted-foreground">
              Esqueceu a senha? Barbeiros: peça ao administrador para trocar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
