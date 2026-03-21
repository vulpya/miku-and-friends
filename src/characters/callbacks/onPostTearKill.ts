import type { ModUpgraded } from "isaacscript-common";
import { getPlayerFromEntity, ModCallbackCustom } from "isaacscript-common";
import { CHARACTERS } from "..";

export const registerPostTearKill = (mod: ModUpgraded): void => {
  mod.AddCallbackCustom(ModCallbackCustom.POST_TEAR_KILL, (tear) => {
    const player = getPlayerFromEntity(tear);

    if (!player) {
      return;
    }

    for (const character of CHARACTERS) {
      if (character.isPlayer(player)) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        character.onPostTearKill?.(tear);
      }
    }
  });
};
