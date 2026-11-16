import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="border-b border-ink">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-8">
        <Image src="/brand/logo.svg" alt="ensaio" width={88} height={31} priority />
      </div>
    </header>
  );
}
