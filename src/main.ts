import { isRepentogon } from "isaacscript-common";
import { version } from "../package.json";
import { registerCharacterCallbacks } from "./characters/callbacks";
import { registerItemCallbacks } from "./items/callbacks";
import { mod, MOD_NAME } from "./mod";

export const main = (): void => {
  registerCharacterCallbacks(mod);
  registerItemCallbacks(mod);

  if (isRepentogon()) {
    print(`\n${MOD_NAME} v${version} loaded. [REPENTOGON]`);
  } else {
    print(`\n${MOD_NAME} v${version} loaded.`);
  }
};
