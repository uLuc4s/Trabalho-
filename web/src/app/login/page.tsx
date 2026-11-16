import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell title="Bem-vindo de volta" description="Entre para acompanhar sua agenda e sua equipe.">
      <LoginForm />
    </AuthShell>
  );
}
