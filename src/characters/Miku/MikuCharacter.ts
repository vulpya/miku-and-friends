import type {
  CollectibleType,
  NullItemID,
  PlayerType,
} from "isaac-typescript-definitions";
import {
  ActiveSlot,
  CacheFlag,
  ModCallback,
} from "isaac-typescript-definitions";
import { addTearsStat, Callback } from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { Debugger } from "../../util/debug";
import { Character } from "../Character";

export interface MikuPlayerData {
  mikuHasIdol?: boolean;
}

const MIKU_CONFIG = {
  name: "Miku",
  type: Isaac.GetPlayerTypeByName("Miku"),
  description: "Uses music to charm enemies. Some may even become fans!",
  birthrightDesc: "Chance to permanently charm enemies scales with Luck.",
  moveSpeed: 0.15,
  damage: -0.8,
  tears: 0.5,
  pocketActive: Isaac.GetItemIdByName("Microphone"),
  costumes: {
    hair: Isaac.GetCostumeIdByPath(
      "gfx/characters/costumes/Character_MikuHead.anm2",
    ),
  },
  nullItem: Isaac.GetItemIdByName("Miku Virtual Idol"),
} as const;

export class MikuCharacter extends Character {
  static getType(): PlayerType {
    return MIKU_CONFIG.type;
  }

  /** Returns display name of Miku. */
  get name(): string {
    return MIKU_CONFIG.name;
  }

  /** Returns the type of Miku. */
  get type(): PlayerType {
    return MikuCharacter.getType();
  }

  /** Returns the description of Miku. */
  get description(): string {
    return MIKU_CONFIG.description;
  }

  /** Returns the birthright quote of Miku. */
  get birthright(): string {
    return MIKU_CONFIG.birthrightDesc;
  }

  /** Returns the hair costume of Miku. */
  get hair(): NullItemID {
    return MIKU_CONFIG.costumes.hair;
  }

  /** Returns base move speed of Miku. */
  get moveSpeed(): number {
    return MIKU_CONFIG.moveSpeed;
  }

  /** Returns base damage of Miku. */
  get damage(): number {
    return MIKU_CONFIG.damage;
  }

  /** Returns base tears of Miku. */
  get tears(): number {
    return MIKU_CONFIG.tears;
  }

  /** Returns the pocket active of Miku. */
  get pocketActive(): CollectibleType {
    return MIKU_CONFIG.pocketActive;
  }

  get nullItem(): CollectibleType {
    return MIKU_CONFIG.nullItem;
  }

  /**
   * Called after Miku is initialized.
   *
   * Adds Miku's hair costume & gives Miku's starting item, the Microphone.
   *
   * @param player The player entity being initialized.
   * @see {@link EntityPlayer} The entity player class.
   */
  @Callback(ModCallback.POST_PLAYER_INIT)
  postPlayerInit(player: EntityPlayer): void {
    if (!this.isMiku(player)) {
      return;
    }

    player.AddNullCostume(this.hair);
    Debugger.char(this.name, `Miku: applied null costume: ${this.hair}`);

    const data = player.GetData() as MikuPlayerData;

    if (!(data.mikuHasIdol ?? false)) {
      player.AddCollectible(this.nullItem, 0);
      data.mikuHasIdol = true;
      Debugger.char(this.name, `Miku: applied null item: ${this.nullItem}`);
    }

    if (!player.HasCollectible(this.pocketActive)) {
      player.SetPocketActiveItem(this.pocketActive, ActiveSlot.POCKET, false);
      Debugger.char(this.name, "Give microphone active item");
    }
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.SPEED)
  onCacheMoveSpeed(player: EntityPlayer): void {
    if (!this.isMiku(player)) {
      return;
    }
    player.MoveSpeed += this.moveSpeed;
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.FIRE_DELAY)
  onCacheFireDelay(player: EntityPlayer): void {
    if (!this.isMiku(player)) {
      return;
    }
    addTearsStat(player, this.tears);
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.DAMAGE)
  onCacheDamage(player: EntityPlayer): void {
    if (!this.isMiku(player)) {
      return;
    }
    player.Damage += this.damage;
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
    eid.addIcon(`Player${this.type}`, "Players", 0, 16, 16, 0, 0, icons);
    eid.addCharacterInfo(this.type, this.description, this.name);
    eid.addBirthright(this.type, this.birthright, this.name);
    Debugger.char(this.name, "Setup EID compatibility");
  }

  private isMiku(player: EntityPlayer) {
    return player.GetPlayerType() === this.type;
  }
}
