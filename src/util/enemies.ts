import { isActiveEnemy } from "isaacscript-common";

/**
 * Attempts to apply the **Charm** status effect to an enemy entity.
 *
 * - If the enemy is **already charmed**, calling this function will refresh the duration unless
 *   `permanent` is `true`.
 * - `EntityRef(entity)` is used internally to ensure the effect is applied correctly. This is
 *   required for mod compatibility and networking in co-op.
 *
 * @param entity The target entity to attempt to charm. Must be an active enemy (alive, not dead or
 *               inactive) or a boss. Entities that are passive, friendly, or non-hostile will not
 *               be charmed.
 * @param frames Duration of the charm effect in frames (1 second = 30 frames). Ignored if
 *               `permanent` is `true`.
 * @param permanent If `true`, the charm effect is applied permanently, ignoring the `frames`
 *                  duration.
 * @returns `true` if the charm effect was successfully applied, otherwise `false`.
 * @example
 * ```ts
 * // Charm a regular enemy for 5 seconds (150 frames)
 * charmEnemy(enemyEntity, 150);
 * ```
 */
export const charmEnemy = (
  entity: Entity,
  frames: number,
  permanent = false,
): boolean => {
  entity.AddCharmed(EntityRef(entity), permanent ? -1 : frames);
  return true;
};

/**
 * Determines whether an entity is a valid target for the **Charm** effect.
 *
 * An entity is considered charmable if:
 * - It is an **active enemy** (alive and not inactive).
 * - It is **vulnerable** (can take damage and interact with effects).
 * - It is **not a boss**.
 *
 * @param entity The entity to evaluate.
 * @returns `true` if the entity can be charmed, otherwise `false`.
 * @example
 * ```ts
 * if (IsCharmableEnemy(entity)) {
 *   charmEnemy(entity, 90); // Charm for 90 frames (3 seconds)
 * }
 * ```
 */
export const isCharmableEnemy = (entity: Entity): boolean =>
  isActiveEnemy(entity) && entity.IsVulnerableEnemy() && !entity.IsBoss();
