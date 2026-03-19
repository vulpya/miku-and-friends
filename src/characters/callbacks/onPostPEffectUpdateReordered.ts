import type { ModUpgraded } from "isaacscript-common";
import { ModCallbackCustom } from "isaacscript-common";
import { CHARACTERS } from "..";

export function registerPostPEffectUpdateReordered(mod: ModUpgraded): void {
  mod.AddCallbackCustom(
    ModCallbackCustom.POST_PEFFECT_UPDATE_REORDERED,
    (player) => {
      for (const character of CHARACTERS) {
        if (character.isPlayer(player)) {
          character.onPostPEffectUpdateReordered?.(player);
        }
      }
    },
  );
}
