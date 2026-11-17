"use client";

import { Loader } from "@/components/loader";
import { useLocale } from "@/i18n/locale";

export default function Loading() {
  const { t } = useLocale();
  return (
    <div className="grid min-h-[60vh] animate-fade place-items-center px-4">
      <div className="flex flex-col items-center gap-5 text-cobalt">
        <Loader className="text-[40px]" label={t.loading.label} />
        <p className="text-[15px] text-muted">{t.loading.text}</p>
      </div>
    </div>
  );
}
