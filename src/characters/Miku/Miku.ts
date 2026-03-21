import type { DamageFlag, NullItemID } from "isaac-typescript-definitions";
import {
  ActiveSlot,
  CollectibleType,
  EntityType,
} from "isaac-typescript-definitions";
import { getPlayerFromEntity } from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { NoteTear } from "../../entities/tears/NoteTear";
import { Debugger } from "../../util/debug";
import { charmEnemy, isCharmableEnemy } from "../../util/enemies";
import { calcChance, rollFromChances, rollValue } from "../../util/rng";
import type { CharacterConfig } from "../Character";
import { Character } from "../Character";

interface MikuConfig extends CharacterConfig {
  /** Miku specific costumes. */
  costumes: {
    hair: NullItemID;
  };
  /** Miku specific tears. */
  tear: NoteTear;
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
  tear: new NoteTear(),
} as const;

export class MikuCharacter extends Character<MikuConfig> {
  constructor() {
    super(MIKU_CONFIG);
  }

  /** Returns the hair costume of Miku. */
  get hair(): NullItemID {
    return this.config.costumes.hair;
  }

  /** Returns the `NoteTear` of Miku. */
  get tear(): NoteTear {
    return this.config.tear;
  }

  /**
   * Called after Miku is initialized.
   *
   * Adds Miku's hair costume & gives Miku's starting item, the Microphone.
   *
   * @param player The player entity being initialized.
   * @see {@link EntityPlayer} The entity player class.
   */
  override onPostPlayerInit(player: EntityPlayer): void {
    player.AddNullCostume(this.hair);
    Debugger.char(this.name, `Miku: applied null costume: ${this.hair}`);

    if (
      this.pocketActive !== undefined
      && !player.HasCollectible(this.pocketActive)
    ) {
      player.SetPocketActiveItem(this.pocketActive, ActiveSlot.POCKET, false);
      Debugger.char(this.name, "Give microphone active item");
    }
  }

  /**
   * Called after a tear from Miku is initialized.
   *
   * Changes the tear variant to always be `NoteTear.TEAR`.
   *
   * @param tear The tear entity that has just been initialized.
   * @see {@link EntityTear} Represents a tear projectile.
   * @see {@link EntityTear.ChangeVariant} Method to change a tears variant.
   * @see {@link NoteTear.TEAR} the `NoteTear` variant.
   */
  override onPostTearInit(tear: EntityTear): void {
    tear.ChangeVariant(this.tear.variant);
  }

  /**
   * Handles additional effects when an enemy takes damage from Miku's tears.
   *
   * Adds a chance to apply a charm effect to the enemy hit for a fixed duration.
   *
   * There is a also a small chance the enemy becomes a fan, permanently charmed it will follow Miku
   * through rooms.
   *
   * ### Notes
   * - It **always returns `true`** to ensure normal damage continues processing.
   *
   * @param entity The entity that is taking damage.
   * @param _amount The amount of damage dealt (currently unused in this method).
   * @param _flags Flags describing the type of damage (unused here).
   * @param source Reference to the source of the damage (e.g., a tear projectile).
   * @param _frames Frame count or timing information (unused in this method).
   * @returns Always returns `true` to indicate damage processing should continue.
   * @see {@link NoteTear.CHARM_CHANCE} - Base chance to charm an enemy temporarily on hit.
   * @see {@link NoteTear.CHARM_DURATION} - Duration of the temporary charm effect.
   * @see {@link NoteTear.FAN_CHANCE} - Chance to permanently charm an enemy on hit.
   * @see {@link getPlayerFromEntity} - Utility to get the player responsible for a given entity.
   * @see {@link charmEnemy} - Function used to apply the charm effect to an entity.
   */
  override onEntityTakeDamage(
    entity: Entity,
    _amount: float,
    _flags: BitFlags<DamageFlag>,
    source: EntityRef,
    _frames: int,
  ): boolean {
    if (
      source.Type !== EntityType.TEAR
      || !source.Entity
      || !isCharmableEnemy(entity)
    ) {
      return true;
    }

    const player = getPlayerFromEntity(source.Entity);
    if (!player) {
      return true;
    }

    const hasBirthright = player.HasCollectible(CollectibleType.BIRTHRIGHT);

    const result = rollFromChances(
      rollValue(),
      calcChance(this.tear.fanChance, hasBirthright ? player.Luck : 0),
      calcChance(this.tear.charmChance, player.Luck),
    );

    if (result === 0) {
      charmEnemy(entity, 0, true);
      Debugger.char(this.name, "Enemy charmed permanently");
    } else if (result === 1) {
      charmEnemy(entity, this.tear.charmDuration);
      Debugger.char(
        this.name,
        `Enemy charmed for ${this.tear.charmDuration / 30}s`,
      );
    }

    return true;
  }

  /**
   * Called after a tear from Miku was killed.
   *
   * Spawns the {@link NoteTear.SPLASH} splash effect.
   *
   * @param tear The tear entity that was killed.
   * @see {@link EntityTear} Represents a tear projectile.
   * @see {@link NoteTear.splash} Spawns the effect and plays the splash animation.
   */
  override onPostTearKill(tear: EntityTear): void {
    this.tear.splash(tear);
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
}
