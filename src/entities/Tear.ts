import type { EffectVariant, TearVariant } from "isaac-typescript-definitions";
import { spawnEffect } from "isaacscript-common";

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
  CHARM_DURATION: 3 * 30,
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

/** Configuration used to define a character. */
export interface TearConfig {
  /** The name of the tear. */
  name: string;

  /** Variant of the tear. */
  variant: TearVariant;

  /** Effect of the tear (e.g Splash). */
  effect: EffectVariant;

  /** Description of the tear. */
  description: string;
}

/** Abstract base class representing a custom character. */
export abstract class Tear<T extends TearConfig = TearConfig> {
  /** Character configuration. */
  protected readonly config: T;

  /**
   * Creates a new Tear definition.
   *
   * @param config Tear configuration.
   */
  constructor(config: T) {
    this.config = config;
  }

  /** Returns the `TearVariant`. */
  get variant(): TearVariant {
    return this.config.variant;
  }

  /** Returns the `EffectVariant` thats linked to the `TearVariant`. */
  get effect(): EffectVariant {
    return this.config.effect;
  }
}
