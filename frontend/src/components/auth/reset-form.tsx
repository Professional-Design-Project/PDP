"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { FormError, SubmitButton } from "@/components/auth/form-status";
import { TextField } from "@/components/auth/text-field";
import { useLocale } from "@/i18n/locale";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth-errors";
import { browserClient } from "@/lib/supabase/client";

export function ResetForm() {
  const { t } = useLocale();
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = browserClient();
    if (!supabase) return;
    if (password.length < 8) {
      setError("short_password");
      return;
    }
    setWorking(true);
    setError(null);
    const { error: failure } = await supabase.auth.updateUser({ password });
    setWorking(false);
    if (failure) {
      setError(authErrorKey(failure));
      return;
    }
    setSaved(true);
  }

  if (saved) {
    return (
      <output className="block animate-fade space-y-4">
        <p className="leading-relaxed text-ink/80">{t.auth.passwordSaved}</p>
        <Link
          href="/practice"
          className="font-semibold underline underline-offset-4 hover:text-cobalt"
        >
          {t.auth.goPractise}
        </Link>
      </output>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <TextField
        id="password"
        label={t.auth.newPassword}
        type="password"
        value={password}
        autoComplete="new-password"
        hint={t.auth.passwordHint}
        disabled={working}
        onChange={setPassword}
      />
      <FormError message={error ? t.auth.errors[error] : null} />
      <SubmitButton label={t.auth.savePassword} working={working} />
    </form>
  );
}
