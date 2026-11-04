import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { KeyRound, Loader2, Mail, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { errorMessage } from "@/lib/format";
import { isRealEmail } from "@/lib/staff-auth";
import { updateMyLoginEmail } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/admin/conta")({
  component: AccountPage,
});

function AccountPage() {
  const qc = useQueryClient();
  const emailFn = useServerFn(updateMyLoginEmail);
  const me = useQuery({
    queryKey: ["my-login-email"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.email ?? "";
    },
  });
  const current = me.data ?? "";
  const hasRealEmail = isRealEmail(current);

  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const saveEmail = useMutation({
    mutationFn: async () => {
      if (!isRealEmail(email)) throw new Error("Informe um e-mail válido.");
      await emailFn({ data: { email } });
      await supabase.auth.refreshSession();
    },
    onSuccess: () => {
      toast.success("E-mail salvo. A partir de agora, entre com ele.");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["my-login-email"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const savePassword = useMutation({
    mutationFn: async () => {
      if (newPw.length < 8) throw new Error("A nova senha precisa ter pelo menos 8 caracteres.");
      if (newPw !== confirmPw) throw new Error("As duas senhas novas não são iguais.");
      const { error: checkErr } = await supabase.auth.signInWithPassword({ email: current, password: currentPw });
      if (checkErr) throw new Error("A senha atual está incorreta.");
      const { error } = await supabase.auth.updateUser({ password: newPw, current_password: currentPw });
      if (error) {
        if (/weak|pwned|easy/i.test(error.message)) throw new Error("Essa senha é muito fácil de adivinhar. Use uma mais forte.");
        if (/different from the old|same/i.test(error.message)) throw new Error("A nova senha precisa ser diferente da atual.");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Senha trocada");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="max-w-xl">
      <PageHeader title="Minha conta" subtitle="E-mail de acesso e senha." />

      <section className="surface-card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Mail className="size-4 text-primary" /> E-mail de acesso
        </h2>
        {me.isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : hasRealEmail ? (
          <p className="text-sm text-muted-foreground">
            Você entra com <strong className="text-foreground">{current}</strong>. Esse é o e-mail que recebe o link de recuperação de senha e o que funciona no "Entrar com Google".
          </p>
        ) : (
          <p className="flex gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
            Seu acesso ainda é pelo número de celular. Cadastre um e-mail para entrar com ele, usar o Google e conseguir recuperar a senha.
          </p>
        )}
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveEmail.mutate();
          }}
        >
          <Label htmlFor="new-email">{hasRealEmail ? "Trocar para outro e-mail" : "Seu e-mail"}</Label>
          <div className="flex gap-2">
            <Input id="new-email" type="email" autoComplete="email" placeholder="seuemail@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" variant="secondary" disabled={saveEmail.isPending || !email}>
              {saveEmail.isPending && <Loader2 className="animate-spin" />} Salvar
            </Button>
          </div>
        </form>
      </section>

      <section className="surface-card mt-6 space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <KeyRound className="size-4 text-primary" /> Trocar senha
        </h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            savePassword.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="current-pw">Senha atual</Label>
            <PasswordInput id="current-pw" autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pw">Nova senha (mín. 8 caracteres)</Label>
            <PasswordInput id="new-pw" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Repita a nova senha</Label>
            <PasswordInput id="confirm-pw" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={8} />
          </div>
          <Button type="submit" disabled={savePassword.isPending}>
            {savePassword.isPending && <Loader2 className="animate-spin" />} Salvar nova senha
          </Button>
        </form>
      </section>
    </div>
  );
}
