import { ModCallback } from "isaac-typescript-definitions";
import { getPlayerFromEntity } from "isaacscript-common";
import { CHARACTERS } from "..";

export const registerPostTearInit = (mod: Mod): void => {
  mod.AddCallback(ModCallback.POST_TEAR_INIT, (tear) => {
    const player = getPlayerFromEntity(tear);

    if (!player) {
      return;
    }

    for (const character of CHARACTERS) {
      if (character.isPlayer(player)) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        character.onPostTearInit?.(tear);
      }
    }
  });
};
