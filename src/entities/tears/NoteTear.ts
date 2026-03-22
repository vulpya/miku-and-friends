import type {
  DamageFlag,
  EffectVariant,
  TearVariant,
} from "isaac-typescript-definitions";
import { CollectibleType, EntityType } from "isaac-typescript-definitions";
import { getPlayerFromEntity, spawnEffect } from "isaacscript-common";
import { MikuCharacter } from "../../characters/Miku/MikuCharacter";
import { Debugger } from "../../util/debug";
import { charmEnemy, isCharmableEnemy } from "../../util/enemies";
import { calcChance, rollFromChances, rollValue } from "../../util/rng";
import type { TearConfig } from "../Tear";
import { Tear } from "../Tear";

interface NoteTearConfig extends TearConfig {
  /** Charm chance of the `NoteTear` in percent. */
  charmChance: number;
  /** Chance to charm an enemy permanently in percent. */
  fanChance: number;
  /** Duration of the charm effect in `seconds * frames`. */
  charmDuration: number;
}

const NOTE_TEAR_CONFIG = {
  name: "Note Tear",
  variant: Isaac.GetEntityVariantByName("NoteTear") as TearVariant,
  effect: Isaac.GetEntityVariantByName("NoteTearSplash") as EffectVariant,
  description:
    "Has a chance to charm enemies, with a small chance to charm permanently",
  charmChance: 10,
  fanChance: 3,
  charmDuration: 3 * 30,
} as const;

export class NoteTear extends Tear<NoteTearConfig> {
  constructor(
    charmChance = NOTE_TEAR_CONFIG.charmChance,
    fanChance = NOTE_TEAR_CONFIG.fanChance,
    charmDuration = NOTE_TEAR_CONFIG.charmDuration,
  ) {
    super({
      ...NOTE_TEAR_CONFIG,
      charmChance,
      fanChance,
      charmDuration,
    });
  }

  /**
   * Spawns effect of `NoteTear` and plays the animation for the splash.
   *
   * // TODO: Make unique splash effect for Note Tears.
   *
   * @see {@link spawnEffect} Helper function to spawn an `EntityType.EFFECT` (1000).
   * @see {@link NOTE_TEAR_CONFIG.effect} Splash entity effect.
   */
  splash(tear: EntityTear): void {
    spawnEffect(this.effect, 0, tear.Position, Vector(0, 0), tear)
      .GetSprite()
      .Play("Splash", true);
  }

  /** Returns the display name of the `NoteTear`. */
  get name(): string {
    return this.config.name;
  }

  /** Returns the charm chance of the `NoteTear` in percent. */
  get charmChance(): number {
    return this.config.charmChance;
  }

  /** Returns the fan chance of the `NoteTear` in percent. */
  get fanChance(): number {
    return this.config.fanChance;
  }

  /** Returns the charm duration of the `NoteTear` in ticks. */
  get charmDuration(): number {
    return this.config.charmDuration;
  }

  /**
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
   */
  onHit(
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

    const hasMikuBirthright =
      player.GetPlayerType() === MikuCharacter.getType()
      && player.HasCollectible(CollectibleType.BIRTHRIGHT);

    const result = rollFromChances(
      rollValue(),
      calcChance(this.fanChance, hasMikuBirthright ? player.Luck : 0),
      calcChance(this.charmChance, player.Luck),
    );

    if (result === 0) {
      charmEnemy(entity, 0, true);
      Debugger.char(this.name, "Enemy charmed permanently");
    } else if (result === 1) {
      charmEnemy(entity, this.charmDuration);
      Debugger.char(this.name, `Enemy charmed for ${this.charmDuration / 30}s`);
    }

    return true;
  }
}
