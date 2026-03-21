import type { CollectibleType } from "isaac-typescript-definitions";
import type { EIDExtended } from "../compat/EID";

/** Result of the `onPostUseItem` callback. */
export interface UseItemResult {
  Discharge: boolean;
  Remove: boolean;
  ShowAnim: boolean;
}

/** Configuration used to define a item. */
export interface ItemConfig {
  /** The name of the item. */
  name: string;
  /** The id of the item. */
  type: CollectibleType;
  /** The description of the item (Used for EID). */
  description: string;
}

/** Abstract base class representing a custom item. */
export abstract class Item<T = ItemConfig> {
  /** Item configuration. */
  public readonly config: T;

  /**
   * Creates a new item definition.
   *
   * @param data Item configuration data.
   */
  constructor(data: T) {
    this.config = data;
    if (this.setupEID) {
      const ExEID = EID as EIDExtended | undefined;
      if (ExEID) {
        this.setupEID(ExEID);
      }
    }
  }

  /**
   * Optional function called during initialization to register compatibility with **External Item
   * Descriptions (EID)**.
   *
   * Override this method to add custom descriptions, effects, or metadata for this item using the
   * provided `EIDExtended` API.
   *
   * @param eid The extended EID API instance used to register descriptions and modify how the item
   *            appears in External Item Descriptions.
   */
  setupEID?(eid: EIDExtended): void;
}
