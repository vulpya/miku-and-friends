import type { ModUpgraded } from "isaacscript-common";
import { ModFeature } from "isaacscript-common";
import type { EIDExtended } from "../compat/EID";

/** Abstract base class representing a custom character. */
export abstract class Character extends ModFeature {
  /** Creates a new character definition. */
  constructor(mod: ModUpgraded, init?: boolean) {
    super(mod, init);
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
   * Override this method to add custom descriptions, effects, or metadata for this character using
   * the provided `EIDExtended` API.
   *
   * @param eid The extended EID API instance used to register descriptions and modify how the
   *            character appears in External Item Descriptions.
   */
  setupEID?(eid: EIDExtended): void;
}
