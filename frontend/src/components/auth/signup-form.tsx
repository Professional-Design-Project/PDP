"use client";

import { type FormEvent, useState } from "react";
import { FormError, SubmitButton } from "@/components/auth/form-status";
import { ProviderSignIn } from "@/components/auth/provider-sign-in";
import { TextField } from "@/components/auth/text-field";
import { useLocale } from "@/i18n/locale";
import { authErrorKey, validateCredentials, type AuthErrorKey } from "@/lib/auth-errors";
import { localePath } from "@/i18n/paths";
import { callbackUrl } from "@/lib/auth-providers";
import { browserClient } from "@/lib/supabase/client";

export function SignupForm({ next }: { next: string }) {
  const { locale, t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = browserClient();
    if (!supabase) return;
    const invalid = validateCredentials(email, password);
    if (invalid) {
      setError(invalid);
      return;
    }
    setWorking(true);
    setError(null);
    const { error: failure } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: callbackUrl(window.location.origin, localePath(locale, next)) },
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
      <output className="block animate-fade space-y-3">
        <p className="text-[24px] leading-tight font-bold tracking-tight">
          {t.auth.checkEmailTitle}
        </p>
        <p className="leading-relaxed text-ink/80">{t.auth.checkEmailText(sentTo)}</p>
      </output>
    );
  }

  return (
    <>
      <ProviderSignIn next={next} />
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
        <TextField
          id="password"
          label={t.auth.password}
          type="password"
          value={password}
          autoComplete="new-password"
          hint={t.auth.passwordHint}
          disabled={working}
          onChange={setPassword}
        />
        <FormError message={error ? t.auth.errors[error] : null} />
        <SubmitButton label={t.auth.signUp} working={working} />
      </form>
    </>
  );
}
