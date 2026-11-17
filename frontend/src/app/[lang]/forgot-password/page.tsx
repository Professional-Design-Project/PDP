import { AuthPage } from "@/components/auth/auth-page";
import { ForgotForm } from "@/components/auth/forgot-form";

export default function ForgotPasswordPage() {
  return (
    <AuthPage variant="forgot">
      <ForgotForm />
    </AuthPage>
  );
}
