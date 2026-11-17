import { AuthPage } from "@/components/auth/auth-page";
import { ResetForm } from "@/components/auth/reset-form";

export default function NewPasswordPage() {
  return (
    <AuthPage variant="reset">
      <ResetForm />
    </AuthPage>
  );
}
