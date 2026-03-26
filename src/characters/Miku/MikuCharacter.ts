import {
  ActiveSlot,
  CacheFlag,
  ModCallback,
  PlayerVariant,
} from "isaac-typescript-definitions";
import { addTearsStat, Callback } from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { CollectibleTypeCustom } from "../../items/enum";
import { Debugger } from "../../util/debug";
import { Character } from "../Character";
import { isMiku, PlayerTypeCustom } from "../enum";

interface MikuPlayerData {
  hasIdol?: boolean;
}

const data: MikuPlayerData = {
  hasIdol: false,
};

const MIKU_CONFIG = {
  name: "Miku",
  description: "Uses music to charm enemies. Some may even become fans!",
  birthrightDesc: "Chance to permanently charm enemies scales with Luck.",
  moveSpeed: 0.15,
  damage: -0.8,
  tears: 0.5,
  pocketActive: CollectibleTypeCustom.MICROPHONE,
  costumes: {
    hair: Isaac.GetCostumeIdByPath("gfx/characters/Character_MikuHead.anm2"),
  },
  nullItem: CollectibleTypeCustom.MIKU_IDOL,
} as const;

export class MikuCharacter extends Character {
  v = data;

  /**
   * Called after Miku is initialized.
   *
   * Adds Miku's hair costume & gives Miku's starting item, the Microphone.
   *
   * @param player The player entity being initialized.
   * @see {@link EntityPlayer} The entity player class.
   */
  @Callback(ModCallback.POST_PLAYER_INIT, PlayerVariant.PLAYER)
  override postPlayerInit(player: EntityPlayer): void {
    if (!isMiku(player)) {
      return;
    }

    player.AddNullCostume(MIKU_CONFIG.costumes.hair);
    Debugger.char(
      MIKU_CONFIG.name,
      `applied null costume: ${MIKU_CONFIG.costumes.hair}`,
    );

    if (!(this.v.hasIdol ?? false)) {
      player.AddCollectible(MIKU_CONFIG.nullItem, 0);
      this.v.hasIdol = true;
      Debugger.char(
        MIKU_CONFIG.name,
        `applied null item: ${MIKU_CONFIG.nullItem}`,
      );
    }

    if (!player.HasCollectible(MIKU_CONFIG.pocketActive)) {
      player.SetPocketActiveItem(
        MIKU_CONFIG.pocketActive,
        ActiveSlot.POCKET,
        false,
      );
      Debugger.char(MIKU_CONFIG.name, "Give microphone pocket active item");
    }
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.SPEED)
  override cacheMoveSpeed(player: EntityPlayer): void {
    if (!isMiku(player)) {
      return;
    }
    player.MoveSpeed += MIKU_CONFIG.moveSpeed;
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.FIRE_DELAY)
  override cacheFireDelay(player: EntityPlayer): void {
    if (!isMiku(player)) {
      return;
    }
    addTearsStat(player, MIKU_CONFIG.tears);
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.DAMAGE)
  override cacheDamage(player: EntityPlayer): void {
    if (!isMiku(player)) {
      return;
    }
    player.Damage += MIKU_CONFIG.damage;
  }

  /**
   * Sets up **External Item Descriptions (EID)** compatibility for Miku.
   *
   * This method registers the player icon, character info, and birthright description with EID, so
   * that in-game tooltips display properly for Miku.
   *
   * @param eid The `EIDExtended` instance used to add compatibility.
   * @see {@link EIDExtended}
   */
  override setupEID(eid: EIDExtended): void {
    const icons = Sprite();
    icons.Load("gfx/player_icons.anm2", true);
    eid.addIcon(
      `Player${PlayerTypeCustom.MIKU}`,
      "Players",
      0,
      16,
      16,
      0,
      0,
      icons,
    );
    eid.addCharacterInfo(
      PlayerTypeCustom.MIKU,
      MIKU_CONFIG.description,
      MIKU_CONFIG.name,
    );
    eid.addBirthright(
      PlayerTypeCustom.MIKU,
      MIKU_CONFIG.birthrightDesc,
      MIKU_CONFIG.name,
    );
    Debugger.char(MIKU_CONFIG.name, "Setup EID compatibility");
  }
}
