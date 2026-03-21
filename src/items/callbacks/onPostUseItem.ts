import { ModCallback } from "isaac-typescript-definitions";
import { ITEMS } from "..";
import type { UseItemResult } from "../Item";

export const registerPostUseItem = (mod: Mod): void => {
  for (const item of ITEMS.filter((i) => i.config.active)) {
    mod.AddCallback(
      ModCallback.POST_USE_ITEM,
      (
        collectibleType,
        rng,
        player,
        useFlags,
        activeSlot,
        customVarData,
      ): boolean | UseItemResult | undefined =>
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        item.onPostUseItem?.(
          collectibleType,
          rng,
          player,
          useFlags,
          activeSlot,
          customVarData,
        ),
      item.config.type,
    );
  }
};
