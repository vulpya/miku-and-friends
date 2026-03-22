import type {
  ActiveSlot,
  CollectibleType,
  UseFlag,
} from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, getEntities } from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { Debugger } from "../../util/debug";
import { charmEnemy, isCharmableEnemy } from "../../util/enemies";
import type { UseItemResult } from "../ActiveItem";
import { ActiveItem } from "../ActiveItem";

const MICROPHONE = {
  /** Item name for the Microphone. */
  NAME: "Microphone",
  /** Item description for Microphone. */
  DESCRIPTION: "Charms all enemies in the room, making them permanent fans",
  /** Item type for Microphone. */
  TYPE: Isaac.GetItemIdByName("Microphone"),
} as const;

export class MicrophoneItem extends ActiveItem {
  static getType(): CollectibleType {
    return MICROPHONE.TYPE;
  }

  /** Returns the display name of the active item. */
  get name(): string {
    return MICROPHONE.NAME;
  }

  /** Returns the type of the active item. */
  get type(): CollectibleType {
    return MicrophoneItem.getType();
  }

  /** Returns the description of the active item. */
  get description(): string {
    return MICROPHONE.DESCRIPTION;
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
  @Callback(ModCallback.POST_USE_ITEM, MICROPHONE.TYPE)
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

    Debugger.item(this.name, `Turned ${count} enemies into fan(s).`);

    return {
      Discharge: true,
      Remove: false,
      ShowAnim: true,
    };
  }

  override setupEID(eid: EIDExtended): void {
    eid.addCollectible(this.type, this.description);
    Debugger.item(this.name, "Setup EID compatibility");
  }
}
