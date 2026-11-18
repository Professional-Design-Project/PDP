import type { Dictionary } from "../en";
import { sitePl } from "./site";
import { landingPl } from "./landing";
import { setupPl } from "./setup";
import { accountPl } from "./account";
import { sessionPl } from "./session";
import { reportsPl } from "./reports";

export const pl: Dictionary = {
  ...sitePl,
  ...landingPl,
  ...setupPl,
  ...accountPl,
  ...sessionPl,
  ...reportsPl,
};
