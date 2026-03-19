const DEBUG = true;

/**
 * This function returns the luck bonus.
 *
 * @param luck Luck stat
 * @returns Calculated luck bonus.
 */
const luckBonus = (luck: number) => luck * 2;

/**
 * Performs a probability roll influenced by a Luck modifier.
 *
 * This function extends a base percentage chance by applying a Luck-based bonus using diminishing
 * returns.
 *
 * Formula: `percent + (100 - percent) * (luckBonus(luck) / 100)`
 *
 * The final computed chance is clamped between 0 and 100 before rolling.
 *
 * ### Notes
 * - Uses `Math.random()`, which generates a pseudo-random number in the range [0, 1].
 *
 * @param percent Base success chance as a percentage (0–100).
 * @param luck Luck modifier. Defaults to 0.
 * @returns `true` if the roll succeeds, otherwise `false`.
 * @see {@link luckBonus} Helper method to return a constant luck bonus.
 * @example
 * // 25% base chance, no luck
 * roll(25); // ~25% success rate
 * @example
 * // 25% base chance, positive luck
 * roll(25, 5); // increased chance (~32.5%)
 * @example
 * // 25% base chance, negative luck
 * roll(25, -5); // decreased chance (~17.5%)
 */
export const roll = (percent: number, luck = 0): boolean => {
  const finalChance = percent + luckBonus(luck);
  const clampedChance = Math.max(0, Math.min(finalChance, 100));
  const result = Math.random() * 100 < clampedChance;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (DEBUG) {
    print(
      `Base percent: ${percent}, Luck: ${luck}, Luck Bonus: ${luckBonus(luck)}, Chance: ${clampedChance.toFixed(
        2,
      )}%, Success: ${result}`,
    );
  }

  return result;
};
