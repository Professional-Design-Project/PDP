import { siteEn } from "./site";
import { landingEn } from "./landing";
import { setupEn } from "./setup";
import { accountEn } from "./account";
import { sessionEn } from "./session";

export const en = {
  ...siteEn,
  ...landingEn,
  ...setupEn,
  ...accountEn,
  ...sessionEn,
};

export type Dictionary = typeof en;
export type SiteDictionary = typeof siteEn;
export type LandingDictionary = typeof landingEn;
export type SetupDictionary = typeof setupEn;
export type AccountDictionary = typeof accountEn;
export type SessionDictionary = typeof sessionEn;
