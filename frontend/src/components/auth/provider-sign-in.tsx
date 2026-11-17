"use client";

import { useState } from "react";
import { buttonStyles } from "@/components/button-styles";
import { FormError } from "@/components/auth/form-status";
import { ProviderIcon } from "@/components/auth/provider-icon";
import { Loader } from "@/components/loader";
import { useLocale } from "@/i18n/locale";
import { localePath } from "@/i18n/paths";
import { callbackUrl, oauthProviders, type OAuthProvider } from "@/lib/auth-providers";
import { browserClient } from "@/lib/supabase/client";

export function ProviderSignIn({ next }: { next: string }) {
  const { locale, t } = useLocale();
  const [working, setWorking] = useState<OAuthProvider | null>(null);
  const [failed, setFailed] = useState<OAuthProvider | null>(null);

  async function start(provider: OAuthProvider) {
    const supabase = browserClient();
    if (!supabase) return;
    setWorking(provider);
    setFailed(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl(window.location.origin, localePath(locale, next)) },
    });
    if (error) {
      setFailed(provider);
      setWorking(null);
    }
  }

  return (
    <div className="mb-6 space-y-3">
      {oauthProviders.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => start(provider)}
          disabled={working !== null}
          className={`${buttonStyles.outline} w-full disabled:cursor-wait disabled:border-line disabled:bg-raised disabled:text-muted`}
        >
          {t.auth.providers[provider].continue}
          {working === provider ? (
            <Loader className="text-[20px]" />
          ) : (
            <ProviderIcon provider={provider} className="size-5 shrink-0" />
          )}
        </button>
      ))}
      <FormError message={failed ? t.auth.providers[failed].failed : null} />
      <p className="flex items-center gap-4 pt-2 text-[14px] text-muted">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        {t.auth.or}
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </p>
    </div>
  );
}
