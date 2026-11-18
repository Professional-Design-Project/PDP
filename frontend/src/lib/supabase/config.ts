export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const authEnabled = Boolean(supabaseUrl && supabaseKey);

export const protectedPaths = ["/practice", "/account", "/history", "/report", "/admin"];

export function isProtected(pathname: string) {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function safeNext(value: string | null | undefined, fallback = "/practice") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
