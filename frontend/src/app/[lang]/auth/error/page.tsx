import { AuthPage } from "@/components/auth/auth-page";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return <AuthPage variant={reason === "provider" ? "providerError" : "error"} />;
}
