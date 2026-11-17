import { arrowMotion, buttonStyles } from "@/components/button-styles";
import { ArrowRightIcon } from "@/components/icons";
import { Loader } from "@/components/loader";

export function SubmitButton({ label, working }: { label: string; working: boolean }) {
  return (
    <button
      type="submit"
      disabled={working}
      className={`${buttonStyles.cobalt} w-full disabled:cursor-wait disabled:bg-raised disabled:text-muted`}
    >
      {label}
      {working ? <Loader className="text-[20px]" /> : <ArrowRightIcon className={arrowMotion} />}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="inline-flex items-start gap-2 text-[14px]">
      <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 bg-persona-rose" />
      {message}
    </p>
  );
}
