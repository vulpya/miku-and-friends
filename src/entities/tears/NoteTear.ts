import type { EffectVariant, TearVariant } from "isaac-typescript-definitions";
import { spawnEffect } from "isaacscript-common";
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
  charmChance: 0,
  fanChance: 0,
  charmDuration: 3 * 30,
} as const;

export class NoteTear extends Tear<NoteTearConfig> {
  constructor() {
    super(NOTE_TEAR_CONFIG);
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
}
