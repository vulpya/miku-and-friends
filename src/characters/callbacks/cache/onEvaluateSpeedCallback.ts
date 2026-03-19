import { CacheFlag, ModCallback } from "isaac-typescript-definitions";
import { CHARACTERS } from "../..";

export function registerEvaluateSpeedCallback(mod: Mod): void {
  mod.AddCallback(
    ModCallback.EVALUATE_CACHE,
    (player: EntityPlayer) => {
      for (const character of CHARACTERS) {
        if (character.isPlayer(player)) {
          character.onEvaluateSpeed(player);
        }
      }
    },
    CacheFlag.SPEED,
  );
}
