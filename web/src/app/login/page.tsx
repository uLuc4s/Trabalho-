// Página de login. O formulário fica em Suspense porque lê o parâmetro ?next= da URL.
import { Suspense } from "react"; // permite mostrar algo enquanto a URL é lida
import { AuthShell } from "@/components/auth/auth-shell"; // moldura das telas de acesso
import { LoginForm } from "@/components/auth/login-form"; // formulário de e-mail e senha

// Monta a página de login.
export default function LoginPage() {
  return (
    <AuthShell title="Bem-vindo de volta" description="Entre para acompanhar sua agenda e sua equipe.">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
