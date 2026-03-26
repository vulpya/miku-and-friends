import type { DamageFlag } from "isaac-typescript-definitions";
import { ModFeature } from "isaacscript-common";

export abstract class TearFeature extends ModFeature {
  /**
   * Optional callback triggered after a tear is created (spawned).
   *
   * @param tear The tear entity that was just initialized.
   */
  postTearInit?(tear: EntityTear): void;

  /**
   * Optional callback triggered every frame while a tear exists.
   *
   * Can be used to modify movement, appearance, or behavior over time.
   *
   * @param tear The tear entity being updated.
   */
  postTearUpdate?(tear: EntityTear): void;

  /**
   * Optional callback triggered after a tear is destroyed.
   *
   * @param tear The tear entity that was destroyed.
   */
  postTearKill?(tear: EntityTear): void;

  /**
   * Optional callback triggered when an entity takes damage.
   *
   * If implemented, returning `false` prevents the damage from being applied.
   *
   * @param entity The entity that is taking damage.
   * @param amount The amount of damage being dealt.
   * @param flags Flags describing the type and source of damage.
   * @param source The entity responsible for the damage (e.g., tear, player, enemy).
   * @param frames The number of frames since the damage occurred (can be used for invincibility
   *               timing).
   * @returns Return `false` to block the damage; otherwise `true`.
   */
  entityTakeDamage?(
    entity: Entity,
    amount: float,
    flags: BitFlags<DamageFlag>,
    source: EntityRef,
    frames: int,
  ): boolean;
}
