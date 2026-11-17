"use client";

import { useState } from "react";
import { buttonStyles } from "@/components/button-styles";
import { FormError } from "@/components/auth/form-status";
import { GitHubIcon } from "@/components/icons";
import { Loader } from "@/components/loader";
import { useLocale } from "@/i18n/locale";
import { localePath } from "@/i18n/paths";
import { callbackUrl } from "@/lib/auth-providers";
import { browserClient } from "@/lib/supabase/client";

export function ProviderSignIn({ next }: { next: string }) {
  const { locale, t } = useLocale();
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    const supabase = browserClient();
    if (!supabase) return;
    setWorking(true);
    setFailed(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: callbackUrl(window.location.origin, localePath(locale, next)) },
    });
    if (error) {
      setFailed(true);
      setWorking(false);
    }
  }

  return (
    <div className="mb-6 space-y-5">
      <button
        type="button"
        onClick={start}
        disabled={working}
        className={`${buttonStyles.outline} w-full disabled:cursor-wait disabled:border-line disabled:bg-raised disabled:text-muted`}
      >
        {t.auth.withGithub}
        {working ? <Loader className="text-[20px]" /> : <GitHubIcon className="size-5 shrink-0" />}
      </button>
      <FormError message={failed ? t.auth.providerFailed : null} />
      <p className="flex items-center gap-4 text-[14px] text-muted">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        {t.auth.or}
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </p>
    </div>
  );
}
