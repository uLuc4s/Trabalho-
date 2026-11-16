// Página de cadastro: cria a conta de acesso. A empresa é criada depois, no onboarding.
import { AuthShell } from "@/components/auth/auth-shell"; // moldura das telas de acesso
import { SignupForm } from "@/components/auth/signup-form"; // formulário de nome, e-mail e senha

// Monta a página de cadastro.
export default function CadastroPage() {
  return (
    <AuthShell title="Crie sua conta" description="Em seguida você cadastra a sua empresa.">
      <SignupForm />
    </AuthShell>
  );
}
