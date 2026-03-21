import { ModCallback } from "isaac-typescript-definitions";
import { getPlayerFromEntity } from "isaacscript-common";
import { CHARACTERS } from "..";

export const registerOnEntityTakeDamage = (mod: Mod): void => {
  mod.AddCallback(
    ModCallback.ENTITY_TAKE_DMG,
    (entity, amount, flags, source, frames) => {
      if (!source.Entity) {
        return true;
      }

      const player = getPlayerFromEntity(source.Entity);

      if (!player) {
        return true;
      }

      for (const character of CHARACTERS) {
        if (character.isPlayer(player)) {
          return character.onEntityTakeDamage(
            entity,
            amount,
            flags,
            source,
            frames,
          );
        }
      }

      return true;
    },
  );
};
