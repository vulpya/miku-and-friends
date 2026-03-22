const DEBUG = {
  RNG: true,
  CHARACTERS: true,
  ITEMS: true,
} as const;

/** Debugging utility functions for the mod. */
export const Debugger = {
  /**
   * Logs a debug message related to items.
   *
   * Only logs if {@link DEBUG.ITEMS} is enabled.
   *
   * @param name The name of the item for context.
   * @param message The debug message to log.
   */
  item: (name: string, message: string): void => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!DEBUG.ITEMS) {
      return;
    }
    print(`[Item\\${name}]: ${message}`);
  },

  /**
   * Logs a debug message related to characters.
   *
   * Only logs if {@link DEBUG.CHARACTERS} is enabled.
   *
   * @param name The name of the character for context.
   * @param message The debug message to log.
   */
  char: (name: string, message: string): void => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!DEBUG.CHARACTERS) {
      return;
    }
    print(`[Character\\${name}]: ${message}`);
  },

  /**
   * Logs a debug message related to RNG and chances.
   *
   * Only logs if {@link DEBUG.RNG} is enabled.
   *
   * @param name The context or source of the RNG event.
   * @param message The debug message to log.
   */
  rng: (name: string, message: string): void => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!DEBUG.RNG) {
      return;
    }
    print(`[RNG\\${name}]: ${message}`);
  },
} as const;
