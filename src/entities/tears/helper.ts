import { EffectVariant, SoundEffect } from "isaac-typescript-definitions";
import { spawnEffect } from "isaacscript-common";

/**
 * Spawns a visual effect and plays a sound when a tear is destroyed.
 *
 * Used in `POST_TEAR_KILL` callbacks to create a poof or burst effect for a tear entity.
 *
 * @param tear The tear entity that has been destroyed.
 * @param effect The type of effect to spawn. Defaults to `EffectVariant.TEAR_POOF_A`.
 */
export const spawnPoof = (
  tear: EntityTear,
  effect = EffectVariant.TEAR_POOF_A,
): void => {
  const poof = spawnEffect(effect, 0, tear.Position, Vector(0, 0), tear);
  poof.PositionOffset = tear.PositionOffset;
  poof.SpriteScale = Vector(tear.Scale, tear.Scale).mul(0.8);
  poof.SetColor(tear.GetColor(), 0, 1);
  SFXManager().Play(SoundEffect.TEAR_IMPACTS);
};
