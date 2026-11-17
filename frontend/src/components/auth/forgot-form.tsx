"use client";

import { type FormEvent, useState } from "react";
import { FormError, SubmitButton } from "@/components/auth/form-status";
import { TextField } from "@/components/auth/text-field";
import { useLocale } from "@/i18n/locale";
import { authErrorKey, validateEmail, type AuthErrorKey } from "@/lib/auth-errors";
import { browserClient } from "@/lib/supabase/client";

export function ForgotForm() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = browserClient();
    if (!supabase) return;
    const invalid = validateEmail(email);
    if (invalid) {
      setError(invalid);
      return;
    }
    setWorking(true);
    setError(null);
    const redirect = new URL("/auth/callback", window.location.origin);
    redirect.searchParams.set("next", "/account/password");
    const { error: failure } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirect.toString(),
    });
    setWorking(false);
    if (failure) {
      setError(authErrorKey(failure));
      return;
    }
    setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <output className="block animate-fade leading-relaxed text-ink/80">
        {t.auth.linkSent(sentTo)}
      </output>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <TextField
        id="email"
        label={t.auth.email}
        type="email"
        value={email}
        autoComplete="email"
        disabled={working}
        onChange={setEmail}
      />
      <FormError message={error ? t.auth.errors[error] : null} />
      <SubmitButton label={t.auth.sendLink} working={working} />
    </form>
  );
}
