import { ModCallback } from "isaac-typescript-definitions";
import { Callback } from "isaacscript-common";
import { isMiku } from "../../characters/enum";
import type { EIDExtended } from "../../compat/EID";
import { TearVariantCustom } from "../../entities/tears/enum";
import { Debugger } from "../../util/debug";
import { CollectibleTypeCustom } from "../enum";
import { Item } from "../Item";

const VIRTUAL_IDOL = {
  name: "Virtual Idol",
  description:
    "Tears are now musical notes with a chance to charm enemies#sometimes enemies will be charmed permanently!",
} as const;

export class VirtualIdolItem extends Item {
  /**
   * Applies the `Musical Note` tears for `Virtual Idol` item.
   *
   * This runs once when a tear is spawned.
   *
   * It filters out non-player tears and only applies the effect if:
   * - The player is `Miku` and has the `MikuNullItem` state enabled, OR
   * - The player holds this collectible item
   *
   * @param tear The tear entity that was just initialized.
   */
  @Callback(ModCallback.POST_TEAR_INIT)
  override postTearInit(tear: EntityTear): void {
    const player = tear.SpawnerEntity?.ToPlayer();
    if (!player) {
      return;
    }

    if (
      !player.HasCollectible(CollectibleTypeCustom.VIRTUAL_IDOL)
      && !isMiku(player)
    ) {
      return;
    }

    tear.ChangeVariant(TearVariantCustom.MUSICAL_NOTE);
    Debugger.item(VIRTUAL_IDOL.name, "'Musical Notes' applied");
  }

  /**
   * Registers this item with the External Item Descriptions (EID) system.
   *
   * Adds the collectible's name and description for in-game display.
   *
   * @param eid Extended EID API instance.
   */
  override setupEID(eid: EIDExtended): void {
    eid.addCollectible(
      CollectibleTypeCustom.VIRTUAL_IDOL,
      VIRTUAL_IDOL.description,
      VIRTUAL_IDOL.name,
    );
    Debugger.item(VIRTUAL_IDOL.name, "Setup EID compatibility");
  }
}
