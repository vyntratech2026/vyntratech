import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Logo } from "@/components/site/brand";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Criar nova senha — Studio Cleison Cortes" },
      { name: "description", content: "Crie uma nova senha para o acesso da equipe." },
      { property: "og:title", content: "Criar nova senha — Studio Cleison Cortes" },
      { property: "og:description", content: "Recuperação de senha da equipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hash.get("error_description")) {
      setReady("invalid");
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && hash.get("type") === "recovery")) setReady("ok");
    });
    // The link may already have been processed before this page subscribed.
    const timer = setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setReady((r) => (r === "ok" ? r : s.session ? "ok" : "invalid"));
    }, 1500);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const save = useMutation({
    mutationFn: async () => {
      if (password.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
      if (password !== confirm) throw new Error("As duas senhas não são iguais.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        if (/weak|pwned|easy/i.test(error.message)) throw new Error("Essa senha é muito fácil de adivinhar. Use uma mais forte.");
        if (/different from the old|same/i.test(error.message)) throw new Error("A nova senha precisa ser diferente da antiga.");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Senha trocada! Você já está dentro.");
      navigate({ to: "/admin", replace: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-96 bg-radial-glow" />
      <div className="relative w-full max-w-sm">
        <Link to="/auth" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar para o login
        </Link>
        <div className="surface-card p-7">
          <Logo className="mx-auto size-20" />
          <h1 className="mt-5 text-center text-xl font-bold">Criar nova senha</h1>

          {ready === "checking" && (
            <div className="mt-8 flex justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}

          {ready === "invalid" && (
            <div className="mt-5 space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Este link expirou ou já foi usado. Peça um novo na tela de login, em "Esqueci minha senha".
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">Ir para o login</Link>
              </Button>
            </div>
          )}

          {ready === "ok" && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="h-11" />
                <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Repita a nova senha</Label>
                <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} className="h-11" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />} Salvar nova senha
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
