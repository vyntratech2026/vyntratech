import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Logo } from "@/components/site/brand";
import { errorMessage } from "@/lib/format";
import { isRealEmail, loginEmail } from "@/lib/staff-auth";
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

function friendlyGoogleError(message: string): string {
  if (/signups? not allowed|not allowed for this instance|user not found/i.test(message)) {
    return "Esta conta Google não faz parte da equipe. Use o mesmo e-mail que o administrador cadastrou para você.";
  }
  return message || "Não foi possível entrar com o Google.";
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.66 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.96S8.78 6.56 12 6.56c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 4.01 14.53 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.59-.06-1.04-.15-1.1Z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const setupFn = useServerFn(setupFirstAdmin);

  useEffect(() => {
    // Errors coming back from the Google sign-in redirect.
    const params = new URLSearchParams(window.location.hash.replace(/^#/, "") || window.location.search);
    const err = params.get("error_description") || params.get("error");
    if (err) {
      toast.error(friendlyGoogleError(err.replace(/\+/g, " ")));
      window.history.replaceState(null, "", window.location.pathname);
    }
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

  const submit = useMutation({
    mutationFn: async () => {
      if (isSetup) {
        if (!isRealEmail(email)) throw new Error("Informe um e-mail válido.");
        await setupFn({ data: { name, email, password } });
        adminExists.refetch();
      }
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail(email), password });
      if (error) throw new Error(/invalid/i.test(error.message) ? "E-mail ou senha incorretos." : error.message);
    },
    onSuccess: () => navigate({ to: "/admin", replace: true }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const forgot = useMutation({
    mutationFn: async () => {
      const address = email.trim().toLowerCase();
      if (!isRealEmail(address)) throw new Error("Digite o e-mail cadastrado no seu acesso.");
      const { error } = await supabase.auth.resetPasswordForEmail(address, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        if (/rate|too many|seconds/i.test(error.message)) throw new Error("Muitos pedidos seguidos. Espere alguns minutos e tente de novo.");
        throw error;
      }
      return address;
    },
    onSuccess: (address) => setResetSentTo(address),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error(friendlyGoogleError(errorMessage(result.error, "")));
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/admin", replace: true });
  };

  const title = isSetup ? "Criar acesso do administrador" : mode === "forgot" ? "Recuperar senha" : "Área da equipe";
  const subtitle = isSetup
    ? "Primeiro acesso: cadastre o dono da barbearia."
    : mode === "forgot"
      ? "Enviaremos um link para você criar uma senha nova."
      : "Entre com seu e-mail e senha.";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-96 bg-radial-glow" />
      <div className="relative w-full max-w-sm">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar ao site
        </Link>
        <div className="surface-card p-7">
          <Logo className="mx-auto size-20" />
          <h1 className="mt-5 text-center text-xl font-bold">{title}</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">{subtitle}</p>

          {mode === "forgot" && !isSetup ? (
            resetSentTo ? (
              <div className="mt-6 space-y-4 text-center">
                <MailCheck className="mx-auto size-10 text-primary" />
                <p className="text-sm">
                  Se <strong>{resetSentTo}</strong> estiver cadastrado, você vai receber um e-mail com o link para criar a nova senha. Confira também o spam.
                </p>
                <Button variant="outline" className="w-full" onClick={() => { setMode("login"); setResetSentTo(null); }}>
                  Voltar para o login
                </Button>
              </div>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  forgot.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" autoComplete="email" placeholder="seuemail@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={forgot.isPending}>
                  {forgot.isPending && <Loader2 className="animate-spin" />} Enviar link
                </Button>
                <button type="button" className="w-full text-center text-sm text-muted-foreground hover:text-primary" onClick={() => setMode("login")}>
                  Voltar para o login
                </button>
              </form>
            )
          ) : (
            <>
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
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type={isSetup ? "email" : "text"}
                    inputMode="email"
                    autoComplete="username"
                    placeholder="seuemail@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    {!isSetup && (
                      <button type="button" className="text-xs text-muted-foreground hover:text-primary" onClick={() => setMode("forgot")}>
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <PasswordInput
                    id="password"
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

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
              <Button type="button" variant="outline" size="lg" className="w-full" disabled={googleLoading} onClick={signInWithGoogle}>
                {googleLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon />} Entrar com Google
              </Button>
              {!isSetup && (
                <p className="mt-5 text-center text-xs text-muted-foreground">
                  O Google só funciona com o mesmo e-mail que o administrador cadastrou para você.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
