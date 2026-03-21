import type {
  ActiveSlot,
  CollectibleType,
  UseFlag,
} from "isaac-typescript-definitions";
import { isActiveEnemy } from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { Debugger } from "../../util/debug";
import { charmEnemy } from "../../util/enemies";
import type { UseItemResult } from "../Item";
import { Item } from "../Item";

const MICROPHONE = {
  /** Item name for the Microphone. */
  NAME: "Microphone",
  /** Item description for Microphone. */
  DESCRIPTION: "Charms all enemies in the room, making them permanent fans",
  /** Item type for Microphone. */
  TYPE: Isaac.GetItemIdByName("Microphone"),
} as const;

export class MicrophoneItem extends Item {
  constructor() {
    super({
      name: MICROPHONE.NAME,
      type: MICROPHONE.TYPE,
    });
  }

  /**
   * Handles the use of the Microphone active item.
   *
   * When used, charms all vulnerable, non-boss enemies in the current room, turning them into a
   * fan.
   *
   * @returns A {@link UseItemResult} object that:
   * - Discharges the item (consumes its charge)
   * - Keeps the item (does not remove it)
   * - Plays the use animation
   */
  override onPostUseItem(
    _collectibleType: CollectibleType,
    _rng: RNG,
    _player: EntityPlayer,
    _flags: BitFlags<UseFlag>,
    _slot: ActiveSlot,
    _data: int,
  ): boolean | UseItemResult {
    const entities = Isaac.GetRoomEntities();
    let count = 0;

    for (const entity of entities) {
      if (
        isActiveEnemy(entity)
        && entity.IsVulnerableEnemy()
        && !entity.IsBoss()
      ) {
        charmEnemy(entity, 0, true);
        count++;
      }
    }

    Debugger.item(MICROPHONE.NAME, `Turned ${count} enemies into fan(s).`);

    return {
      Discharge: true,
      Remove: false,
      ShowAnim: true,
    };
  }

  /**
   * Sets up **External Item Descriptions (EID)** compatibility for the Microphone.
   *
   * This method registers the collectible description with EID, so that in-game tooltips display
   * properly for the Microphone.
   *
   * @param eid The `EIDExtended` instance used to add compatibility.
   * @see {@link EIDExtended}
   */
  override setupEID(eid: EIDExtended): void {
    eid.addCollectible(MICROPHONE.TYPE, MICROPHONE.DESCRIPTION);
    Debugger.item(MICROPHONE.NAME, "Setup EID compatibility");
  }
}
