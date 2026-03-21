import type { ModUpgraded } from "isaacscript-common";
import { registerPostUseItem } from "./onPostUseItem";

export const registerItemCallbacks = (mod: ModUpgraded): void => {
  registerPostUseItem(mod);
};
