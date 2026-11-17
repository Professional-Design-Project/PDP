import { AuthPage } from "@/components/auth/auth-page";
import { SignupForm } from "@/components/auth/signup-form";
import { safeNext } from "@/lib/supabase/config";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);
  return (
    <AuthPage variant="signup" next={next}>
      <SignupForm next={next} />
    </AuthPage>
  );
}
