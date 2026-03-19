import { ModCallback } from "isaac-typescript-definitions";
import { CHARACTERS } from "..";

export function registerPostPlayerInitCallback(mod: Mod): void {
  mod.AddCallback(ModCallback.POST_PLAYER_INIT, (player) => {
    for (const character of CHARACTERS) {
      if (character.isPlayer(player)) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        character.onPostPlayerInit?.(player);
      }
    }
  });
}
