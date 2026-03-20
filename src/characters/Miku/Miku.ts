import type {
  DamageFlag,
  EffectVariant,
  TearVariant,
} from "isaac-typescript-definitions";
import { CollectibleType, EntityType } from "isaac-typescript-definitions";
import {
  getPlayerFromEntity,
  isActiveEnemy,
  spawnEffect,
} from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { charmEnemy } from "../../util/enemies";
import { calcChance, rollFromChances, rollValue } from "../../util/rng";
import { Character } from "../Character";

const MIKU = {
  /** Internal character name for Miku. */
  NAME: "Miku",
  /** Character description for Miku. */
  DESCRIPTION: "Uses music to charm enemies. Some may even become fans!",
  /** Birthright description for Miku. */
  BIRTHRIGHT_DESC: "Chance to permanently charm enemies scales with Luck.",
  /** Player type for Miku. */
  TYPE: Isaac.GetPlayerTypeByName("Miku"),
  /** Costume ID for Miku's hair. */
  HAIR: Isaac.GetCostumeIdByPath("gfx/characters/Character_MikuHead.anm2"),
  /** Base move speed bonus for Miku. */
  SPEED: 0.15,
  /** Base damage bonus for Miku. */
  DAMAGE: -0.8,
  /** Base tears bonus for Miku. */
  TEARS: 0.5,
} as const;

const NoteTear = {
  /** Variant for Note Tear. */
  TEAR: Isaac.GetEntityVariantByName("NoteTear") as TearVariant,
  /** Variant for Note Tear Splash. */
  SPLASH: Isaac.GetEntityVariantByName("NoteTearSplash") as EffectVariant,
  /** Charm chance of the note tears in percent. */
  CHARM_CHANCE: 10,
  /** Chance to charm an enemy permanently in percent. */
  FAN_CHANCE: 3,
  /** Duration of the charm effect in `seconds * frames`. */
  CHARM_DURATION: 2 * 30,
  /**
   * Spawns splash effect `NoteTear.SPLASH` and plays the animation for the `NoteTear`.
   *
   * @see {@link spawnEffect} Helper function to spawn an `EntityType.EFFECT` (1000).
   * @see {@link NoteTear.SPLASH} Splash entity effect.
   */
  splash: (tear: EntityTear) => {
    // TODO: Make unique splash effect for Note Tears.
    spawnEffect(NoteTear.SPLASH, 0, tear.Position, Vector(0, 0), tear)
      .GetSprite()
      .Play("Splash", true);
  },
} as const;

export class MikuCharacter extends Character {
  constructor() {
    super({
      name: MIKU.NAME,
      type: MIKU.TYPE,
      moveSpeed: MIKU.SPEED,
      damage: MIKU.DAMAGE,
      tears: MIKU.TEARS,
    });

    const ExEID = EID as EIDExtended | undefined;
    if (!ExEID) {
      return;
    }

    const icons = Sprite();
    icons.Load("gfx/player_icons.anm2", true);
    ExEID.addIcon(`Player${MIKU.TYPE}`, "Players", 0, 16, 16, 0, 0, icons);
    ExEID.addCharacterInfo(MIKU.TYPE, MIKU.DESCRIPTION, MIKU.NAME);
    ExEID.addBirthright(MIKU.TYPE, MIKU.BIRTHRIGHT_DESC, MIKU.NAME);
  }

  /**
   * Called after Miku is initialized.
   *
   * Adds Miku's hair costume.
   *
   * @param player The player entity being initialized.
   * @see {@link EntityPlayer} The entity player class.
   */
  override onPostPlayerInit(player: EntityPlayer): void {
    player.AddNullCostume(MIKU.HAIR);
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
    tear.ChangeVariant(NoteTear.TEAR);
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
   * @see {@link Entity} - Base class for all entities.
   * @see {@link EntityRef} - Reference wrapper used for entities.
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
    if (source.Type !== EntityType.TEAR || !source.Entity) {
      return true;
    }

    const player = getPlayerFromEntity(source.Entity);
    if (!player) {
      return true;
    }

    if (!isActiveEnemy(entity) || entity.IsInvincible() || entity.IsBoss()) {
      return true;
    }

    const hasBirthright = player.HasCollectible(CollectibleType.BIRTHRIGHT);

    const result = rollFromChances(
      rollValue(),
      calcChance(NoteTear.FAN_CHANCE, hasBirthright ? player.Luck : 0),
      calcChance(NoteTear.CHARM_CHANCE, player.Luck),
    );

    if (result === 0) {
      charmEnemy(entity, NoteTear.CHARM_DURATION, true);
    } else if (result === 1) {
      charmEnemy(entity, NoteTear.CHARM_DURATION);
    }

    return true;
  }

  /**
   * Called after a tear from Miku was killed.
   *
   * Spawns the `NoteTear` splash effect.
   *
   * @param tear The tear entity that was killed.
   * @see {@link EntityTear} Represents a tear projectile.
   * @see {@link NoteTear.splash} Spawns the effect and plays the splash animation.
   */
  override onPostTearKill(tear: EntityTear): void {
    NoteTear.splash(tear);
  }
}
