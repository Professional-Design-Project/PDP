import { NextResponse, type NextRequest } from "next/server";
import { localeCookie, locales, type Locale } from "@/i18n/config";
import { preferredLocale } from "@/i18n/negotiate";
import { localePath, splitLocale } from "@/i18n/paths";
import { authEnabled } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/proxy";

const unprefixed = ["/auth/callback"];

function alternates(request: NextRequest, rest: string) {
  const { origin } = request.nextUrl;
  return [
    ...locales.map(
      (locale) => `<${origin}${localePath(locale, rest)}>; rel="alternate"; hreflang="${locale}"`,
    ),
    `<${origin}${localePath("en", rest)}>; rel="alternate"; hreflang="x-default"`,
  ].join(", ");
}

function redirectToLocale(request: NextRequest) {
  const locale = preferredLocale(
    request.cookies.get(localeCookie)?.value,
    request.headers.get("accept-language"),
  );
  const target = request.nextUrl.clone();
  target.pathname = localePath(locale, request.nextUrl.pathname);
  return NextResponse.redirect(target);
}

async function localized(request: NextRequest, locale: Locale, rest: string) {
  const response = authEnabled ? await updateSession(request, locale, rest) : NextResponse.next();
  if (response.status === 200) response.headers.set("Link", alternates(request, rest));
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (unprefixed.some((path) => pathname.startsWith(path))) {
    return authEnabled ? updateSession(request, null, pathname) : NextResponse.next();
  }
  const { locale, rest } = splitLocale(pathname);
  if (!locale) return redirectToLocale(request);
  return localized(request, locale, rest);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|brand/|icon.png|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|txt|xml)$).*)",
  ],
};
