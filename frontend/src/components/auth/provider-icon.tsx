import { GitHubIcon, GoogleIcon } from "@/components/icons";
import type { OAuthProvider } from "@/lib/auth-providers";

export function ProviderIcon({
  provider,
  className,
}: {
  provider: OAuthProvider;
  className?: string;
}) {
  return provider === "google" ? (
    <GoogleIcon className={className} />
  ) : (
    <GitHubIcon className={className} />
  );
}
