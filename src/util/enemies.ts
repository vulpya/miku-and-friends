import type { EntityType } from "isaac-typescript-definitions";
import { EffectVariant } from "isaac-typescript-definitions";
import {
  getEntities,
  isActiveEnemy,
  spawnEffect,
  VectorZero,
} from "isaacscript-common";
import { getFrames } from "./frames";

/**
 * Checks if an entity is eligible for the **Charm** effect.
 *
 * An entity is charmable if it is:
 * - Active and alive.
 * - Vulnerable (can take damage and respond to effects).
 * - Not a boss.
 *
 * @param entity The entity to check.
 * @returns `true` if the entity can be charmed, otherwise `false`.
 */
export const isCharmableEnemy = (entity: Entity): boolean =>
  isActiveEnemy(entity) && entity.IsVulnerableEnemy() && !entity.IsBoss();

/**
 * Applies the **Charm** effect to an enemy entity.
 *
 * - If the enemy is already charmed, calling this will refresh the duration unless `permanent` is
 *   `true`.
 * - Bosses cannot be charmed.
 *
 * @param entity The target enemy to charm.
 * @param seconds Duration of the charm effect in seconds. Ignored if `permanent` is `true`.
 * @param permanent If `true`, applies charm indefinitely.
 * @returns Always returns `true` after applying the effect.
 * @example
 * ```ts
 * charmEnemy(enemyEntity, 5); // Charm for 5 seconds
 * ```
 */
export const charmEnemy = (
  entity: Entity,
  seconds: number,
  permanent = false,
): boolean => {
  entity.AddCharmed(
    EntityRef(entity),
    permanent && !entity.IsBoss() ? -1 : getFrames(seconds),
  );
  return true;
};

/**
 * Checks if an entity is eligible for the **Freeze** effect.
 *
 * An entity is freezable if it is:
 * - Active and alive.
 * - Vulnerable (can take damage and respond to effects).
 *
 * @param entity The entity to check.
 * @returns `true` if the entity can be frozen, otherwise `false`.
 */
export const isFreezableEnemy = (entity: Entity): boolean =>
  isActiveEnemy(entity) && entity.IsVulnerableEnemy();

/**
 * Applies the **Freeze** effect to an enemy entity.
 *
 * - If the enemy is already frozen, calling this will refresh the duration unless `permanent` is
 *   `true`.
 * - Bosses cannot receive permanent freeze; their duration is always frame-based.
 *
 * @param entity The target enemy or boss to freeze.
 * @param seconds Duration of the freeze effect in seconds. Ignored if `permanent` is `true`.
 * @param permanent If `true`, applies freeze indefinitely (except for bosses, which still use
 *                  `frames`).
 * @returns Always returns `true` after applying the effect.
 * @example
 * ```ts
 * freezeEnemy(enemyEntity, 3); // Freeze for 3 seconds
 * ```
 */
export const freezeEnemy = (
  entity: Entity,
  seconds: number,
  permanent = false,
): boolean => {
  entity.AddFreeze(
    EntityRef(entity),
    permanent && !entity.IsBoss() ? -1 : getFrames(seconds),
  );
  return true;
};

/**
 * Checks if an entity is eligible for the **Burn** effect.
 *
 * An entity is burnable if it is:
 * - Active and alive.
 * - Vulnerable (can take damage and respond to status effects).
 *
 * @param entity The entity to check.
 * @returns `true` if the entity can be burned, otherwise `false`.
 */
export const isBurnableEnemy = (entity: Entity): boolean =>
  isActiveEnemy(entity) && entity.IsVulnerableEnemy();

/**
 * Applies the **Burn** effect to an enemy entity.
 *
 * - If the enemy is already burning, calling this will refresh the duration unless `permanent` is
 *   `true`.
 * - Bosses cannot receive permanent burn; their duration is always frame-based.
 *
 * @param entity The target enemy or boss to burn.
 * @param damage Damage dealt per tick while burning.
 * @param seconds Duration of the burn effect in seconds. Ignored if `permanent` is `true` (except
 *                for bosses).
 * @param permanent If `true`, applies burn indefinitely (non-boss enemies only).
 * @returns Always returns `true` after applying the effect.
 * @example
 * ```ts
 * burnEnemy(enemyEntity, 3.5, 4); // Burn for 4 seconds dealing 3.5 damage per tick
 * ```
 */
export const burnEnemy = (
  entity: Entity,
  damage: float,
  seconds: number,
  permanent = false,
): boolean => {
  entity.AddBurn(
    EntityRef(entity),
    permanent && !entity.IsBoss() ? -1 : getFrames(seconds),
    damage,
  );
  return true;
};

/**
 * Returns a unique key for an enemy, combining type and variant.
 *
 * Useful for tracking specific enemies (e.g., for Rubber Note effects).
 *
 * @param npc The enemy entity.
 * @returns A string in the format `"Type_Variant"`, e.g., `"3_1"`.
 * @example
 * ```ts
 * const key = getEnemyKey(enemyEntity); // "3_1"
 * ```
 */
export const getEnemyKey = (npc: EntityNPC): string =>
  `${npc.Type}_${npc.Variant}`;

/**
 * Instantly removes all active enemies of a specific type and variant from the room.
 *
 * @param type The entity type to remove (e.g., `EntityType.ENTITY_FLY`).
 * @param variant The variant of the entities to remove.
 * @returns The number of enemies that were erased.
 * @example
 * ```ts
 * const erasedCount = eraseEnemies(EntityType.ENTITY_FLY, 1);
 * print(`Removed ${erasedCount} enemies.`);
 * ```
 */
export const eraseEnemies = (
  type: EntityType,
  variant: Entity["Variant"],
): number => {
  const enemies = getEntities(type, variant, -1, true).filter((e) =>
    isActiveEnemy(e),
  );

  for (const enemy of enemies) {
    enemy.Remove();
    const puff = spawnEffect(
      EffectVariant.POOF_1,
      0,
      enemy.Position,
      VectorZero,
      enemy,
    );
    // Eraser color.
    puff.SetColor(Color(1, 0.4, 0.6, 1, 0, 0, 0), -1, 0);
  }
  return enemies.length;
};
