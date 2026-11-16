import { Loader } from "@/components/loader";

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] animate-fade place-items-center px-4">
      <div className="flex flex-col items-center gap-5 text-cobalt">
        <Loader className="text-[40px]" label="Loading" />
        <p className="text-[15px] text-muted">Setting things up</p>
      </div>
    </div>
  );
}
