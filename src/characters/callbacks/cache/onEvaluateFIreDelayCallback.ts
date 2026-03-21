import { CacheFlag, ModCallback } from "isaac-typescript-definitions";
import { CHARACTERS } from "../..";

export const registerEvaluateFireDelayCallback = (mod: Mod): void => {
  mod.AddCallback(
    ModCallback.EVALUATE_CACHE,
    (player: EntityPlayer) => {
      for (const character of CHARACTERS) {
        if (character.isPlayer(player)) {
          character.onEvaluateFireDelay(player);
        }
      }
    },
    CacheFlag.FIRE_DELAY,
  );
};
