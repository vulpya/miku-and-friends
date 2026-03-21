import type {
  ActiveSlot,
  CollectibleType,
  UseFlag,
} from "isaac-typescript-definitions";
import { getEntities } from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { Debugger } from "../../util/debug";
import { charmEnemy, isCharmableEnemy } from "../../util/enemies";
import { ActiveItem } from "../ActiveItem";
import type { UseItemResult } from "../Item";

const MICROPHONE = {
  /** Item name for the Microphone. */
  NAME: "Microphone",
  /** Item description for Microphone. */
  DESCRIPTION: "Charms all enemies in the room, making them permanent fans",
  /** Item type for Microphone. */
  TYPE: Isaac.GetItemIdByName("Microphone"),
} as const;

export class MicrophoneItem extends ActiveItem {
  constructor() {
    super({
      name: MICROPHONE.NAME,
      type: MICROPHONE.TYPE,
      description: MICROPHONE.DESCRIPTION,
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
   * - Keeps the item
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
    const enemies = getEntities(-1, -1, -1, true).filter((e) =>
      isCharmableEnemy(e),
    );

    let count = 0;
    for (const enemy of enemies) {
      charmEnemy(enemy, 0, true);
      count++;
    }

    Debugger.item(this.config.name, `Turned ${count} enemies into fan(s).`);

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
    eid.addCollectible(this.config.type, this.config.description);
    Debugger.item(this.config.name, "Setup EID compatibility");
  }
}
