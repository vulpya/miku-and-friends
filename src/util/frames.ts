/** Number of frames representing one second. */
const ONCE_SECOND_IN_FRAMES = 30;

/**
 * Converts a duration in seconds to frames.
 *
 * @param seconds The duration in seconds.
 * @returns The equivalent number of frames.
 */
export const getFrames = (seconds: number): number =>
  seconds * ONCE_SECOND_IN_FRAMES;
