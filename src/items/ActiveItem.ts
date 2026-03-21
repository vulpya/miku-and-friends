import type {
  ActiveSlot,
  CollectibleType,
  UseFlag,
} from "isaac-typescript-definitions";
import type { ItemConfig, UseItemResult } from "./Item";
import { Item } from "./Item";

interface ActiveItemData extends ItemConfig {
  /** `true`, if the item is an active item or not. */
  active: boolean;
}

/** Abstract base class representing a custom active item. */
export abstract class ActiveItem extends Item<ActiveItemData> {
  /** Item configuration data. */
  public readonly active = true;

  /**
   * Creates a new active item definition.
   *
   * @param data Item configuration data.
   */
  constructor(data: ItemConfig) {
    super({
      ...data,
      active: true,
    });
  }

  /**
   * Called after an active item is used.
   *
   * @param collectibleType The ID of the item that was used.
   * @param rng The RNG instance associated with the item use.
   * @param player The player who used the item.
   * @param useFlags Flags describing how the item was used (e.g. via card, pill, etc.).
   * @param activeSlot The active item slot the item was used from.
   * @param customVarData Custom variable data passed from the item (if any).
   */
  onPostUseItem?(
    collectibleType: CollectibleType,
    rng: RNG,
    player: EntityPlayer,
    useFlags: BitFlags<UseFlag>,
    activeSlot: ActiveSlot,
    customVarData: int,
  ): boolean | UseItemResult;
}
