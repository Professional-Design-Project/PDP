export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const publicPages = ["/", "/how-ai-works", "/privacy"];

export const privatePages = [
  "/practice",
  "/history",
  "/account",
  "/report",
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
  "/auth",
];
