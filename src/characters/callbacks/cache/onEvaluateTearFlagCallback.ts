import { CacheFlag, ModCallback } from "isaac-typescript-definitions";
import { CHARACTERS } from "../..";

export function registerEvaluateTearFlagCallback(mod: Mod): void {
  mod.AddCallback(
    ModCallback.EVALUATE_CACHE,
    (player: EntityPlayer) => {
      for (const character of CHARACTERS) {
        if (character.isPlayer(player)) {
          character.onEvaluateTearFlags(player);
        }
      }
    },
    CacheFlag.TEAR_FLAG,
  );
}
