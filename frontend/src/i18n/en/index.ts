import { siteEn } from "./site";
import { landingEn } from "./landing";
import { setupEn } from "./setup";
import { accountEn } from "./account";
import { sessionEn } from "./session";
import { reportsEn } from "./reports";

export const en = {
  ...siteEn,
  ...landingEn,
  ...setupEn,
  ...accountEn,
  ...sessionEn,
  ...reportsEn,
};

export type Dictionary = typeof en;
export type SiteDictionary = typeof siteEn;
export type LandingDictionary = typeof landingEn;
export type SetupDictionary = typeof setupEn;
export type AccountDictionary = typeof accountEn;
export type SessionDictionary = typeof sessionEn;
export type ReportsDictionary = typeof reportsEn;
