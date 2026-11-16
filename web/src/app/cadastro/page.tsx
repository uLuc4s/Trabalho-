import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function CadastroPage() {
  return (
    <AuthShell title="Crie sua conta" description="Em seguida você cadastra a sua empresa.">
      <SignupForm />
    </AuthShell>
  );
}
