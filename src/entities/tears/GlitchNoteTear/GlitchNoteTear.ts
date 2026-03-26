import {
  EffectVariant,
  ModCallback,
  TearFlag,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  getPlayerFromEntity,
  ModCallbackCustom,
  spawnEffect,
  VectorZero,
} from "isaacscript-common";
import { isMiku } from "../../../characters/enum";
import { Debugger } from "../../../util/debug";
import { TearVariantCustom } from "../enum";
import { onTearKill } from "../helper";
import { TearFeature } from "../TearFeature";

const GLITCH_NOTE_TEAR = {
  name: "Glitch Note",
  description: "TODO",
} as const;

const data = {};

export class GlitchNoteTear extends TearFeature {
  v = data;

  @Callback(ModCallback.POST_TEAR_INIT, TearVariantCustom.GLITCH_NOTE)
  override postTearInit(tear: EntityTear): void {
    Debugger.tear(GLITCH_NOTE_TEAR.name, "Add tear flag: 'TearFlag.BOUNCE'");
    tear.AddTearFlags(TearFlag.BOUNCE);
  }

  @Callback(ModCallback.POST_TEAR_UPDATE, TearVariantCustom.GLITCH_NOTE)
  override postTearUpdate(tear: EntityTear): void {
    const player = getPlayerFromEntity(tear);

    if (!player || !isMiku(player, true)) {
      return;
    }

    const brightness = Math.random() * 0.45;
    const alpha = 0.6 + Math.random() * 0.3; // Range: 0.6 → 0.9
    const color = Color(brightness, brightness, brightness, alpha, 0, 0, 0);
    tear.SetColor(color, -1, 1);

    // Occasionally offset position slightly to create a subtle "floaty" jitter.
    if (Math.random() < 0.15) {
      tear.Position = tear.Position.add(
        Vector((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3),
      );
    }

    // Apply small random rotation shifts for a less rigid, more organic motion.
    if (Math.random() < 0.2) {
      tear.SpriteRotation += (Math.random() - 0.5) * 4;
    }

    // Spawn a faint trailing afterimage to enhance the ghost-like aesthetic.
    if (Math.random() < 0.3) {
      const ghost = spawnEffect(
        EffectVariant.TEAR_POOF_A,
        0,
        tear.Position,
        VectorZero,
        tear,
      );

      // Keep the trail subtle and short-lived.
      ghost.SpriteScale = Vector(0.3, 0.3);
      ghost.SetColor(color, -1, 1);
      ghost.Timeout = 5;
    }
  }

  @CallbackCustom(
    ModCallbackCustom.POST_TEAR_KILL,
    TearVariantCustom.GLITCH_NOTE,
  )
  override postTearKill(tear: EntityTear): void {
    onTearKill(tear, EffectVariant.TEAR_POOF_B);
  }
}
