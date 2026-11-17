"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FormError, SubmitButton } from "@/components/auth/form-status";
import { TextField } from "@/components/auth/text-field";
import { useLocale } from "@/i18n/locale";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth-errors";
import { localePath } from "@/i18n/paths";
import { browserClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = browserClient();
    if (!supabase) return;
    setWorking(true);
    setError(null);
    const { error: failure } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (failure) {
      setError(authErrorKey(failure));
      setWorking(false);
      return;
    }
    router.replace(localePath(locale, next));
    router.refresh();
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
      <TextField
        id="password"
        label={t.auth.password}
        type="password"
        value={password}
        autoComplete="current-password"
        disabled={working}
        onChange={setPassword}
      />
      <Link
        href="/forgot-password"
        className="inline-block text-[14px] font-semibold underline underline-offset-4 hover:text-cobalt"
      >
        {t.auth.forgot}
      </Link>
      <FormError message={error ? t.auth.errors[error] : null} />
      <SubmitButton label={t.auth.signIn} working={working} />
    </form>
  );
}
