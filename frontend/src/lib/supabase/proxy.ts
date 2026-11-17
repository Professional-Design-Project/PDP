import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/i18n/paths";
import { isProtected, supabaseKey, supabaseUrl } from "@/lib/supabase/config";

function redirectWithCookies(target: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(target);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  ["cache-control", "expires", "pragma"].forEach((header) => {
    const value = from.headers.get(header);
    if (value) redirect.headers.set(header, value);
  });
  return redirect;
}

export async function updateSession(request: NextRequest, locale: Locale | null, rest: string) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;
  if (!locale) return response;

  if (!signedIn && isProtected(rest)) {
    const login = request.nextUrl.clone();
    login.pathname = localePath(locale, "/login");
    login.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return redirectWithCookies(login, response);
  }

  if (signedIn && (rest === "/login" || rest === "/signup")) {
    const practice = request.nextUrl.clone();
    practice.pathname = localePath(locale, "/practice");
    practice.search = "";
    return redirectWithCookies(practice, response);
  }

  return response;
}
