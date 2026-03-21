import type {
  ActiveSlot,
  CollectibleType,
  UseFlag,
} from "isaac-typescript-definitions";
import type { EIDExtended } from "../compat/EID";

/** Result of the `onPostUseItem` callback. */
export interface UseItemResult {
  Discharge: boolean;
  Remove: boolean;
  ShowAnim: boolean;
}

/** Configuration data used to define a item. */
interface ItemData {
  /** The name of the item. */
  name: string;
  /** The id of the item. */
  type: CollectibleType;
}

/** Abstract base class representing a custom item. */
export abstract class Item {
  /** Item configuration data. */
  public readonly data: ItemData;

  /**
   * Creates a new item definition.
   *
   * @param data Item configuration data.
   */
  constructor(data: ItemData) {
    this.data = data;
    if (this.setupEID) {
      const ExEID = EID as EIDExtended | undefined;
      if (ExEID) {
        this.setupEID(ExEID);
      }
    }
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

  /** Called in the constructor, override to add EID compatibility. */
  setupEID?(eid: EIDExtended): void;
}
