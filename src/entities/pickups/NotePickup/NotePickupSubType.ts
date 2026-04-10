import { SoundEffect, TearFlag } from "isaac-typescript-definitions";
import { arrayToBitFlags, isActiveEnemy } from "isaacscript-common";
import type { TaintedMikuData } from "../../../characters/Miku/MikuTaintedCharacter";
import { getData } from "../../../util/data";
import { Debugger } from "../../../util/debug";
import {
  burnEnemy,
  charmEnemy,
  confuseEnemy,
  eraseEnemies,
  fearEnemy,
  freezeEnemy,
  getEnemyKey,
  isBurnable,
  isCharmable,
  isConfusable,
  isFearable,
  isFreezable,
  isMidasFreezable,
  midasFreezeEnemy,
} from "../../../util/enemies";
import { rollChance } from "../../../util/rng";
import type { GlitchNoteTearData } from "../../tears/GlitchNoteTear/GlitchNoteTear";
import type { NoteTypeConfig } from "./NotePickup";

/** Represents the different subtypes of musical note pickups. */
export enum NotePickupSubType {
  SPOOKY = 1,
  LOVE,
  TOXIC,
  GOLDEN,
  HOMING,
  ERASER,
  ICE,
  FIRE,
}

/**
 * Mapping of each `NotePickup` subtype to its configuration.
 *
 * Each data includes:
 * - Name and description for display and EID support.
 * - Color used for the pickup's sprite.
 * - Drop chance weight (Default is 1, higher weight = more likely).
 * - Number of uses before depletion.
 * - The effect function that applies the note’s unique behavior to tears.
 */
export const NOTE_TYPE_DATA: Record<NotePickupSubType, NoteTypeConfig> = {
  [NotePickupSubType.SPOOKY]: {
    name: "Spooky Note",
    description: "Causes fear or slows enemies down.",
    color: Color(0.15, 0.25, 0.4, 1, 0, 0, 0),
    weight: 2,
    uses: 3,
    applyEffect: (player, tear) => {
      tear.AddTearFlags(TearFlag.CONFUSION);
      tear.AddTearFlags(TearFlag.FEAR);

      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (npc: EntityNPC) => {
        if (rollChance(50, player.GetDropRNG())) {
          if (isFearable(npc)) {
            fearEnemy(npc, 1.5);
          }
        } else if (isConfusable(npc)) {
          confuseEnemy(npc, 2);
        }
      };
    },
  },
  [NotePickupSubType.LOVE]: {
    name: "Love Note",
    description: "Charms an enemy permanently.",
    color: Color(0.85, 0.25, 0.25, 1, 0, 0, 0),
    weight: 1,
    uses: 1,
    applyEffect: (_player: EntityPlayer, tear: EntityTear) => {
      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (enemy: EntityNPC) => {
        if (isCharmable(enemy)) {
          charmEnemy(enemy, 0, true);
        }
      };
    },
  },
  [NotePickupSubType.TOXIC]: {
    name: "Toxic Note",
    description: "Poisons and explodes on impact.",
    color: Color(0.25, 0.75, 0.35, 1, 0, 0, 0),
    weight: 0.5,
    uses: 1,
    applyEffect: (_player, tear) => {
      tear.AddTearFlags(arrayToBitFlags([TearFlag.POISON, TearFlag.EXPLOSIVE]));
    },
  },
  [NotePickupSubType.GOLDEN]: {
    name: "Greedy Note",
    description: "Small chance to apply {{ColorGold}}Midas Touch{{CR}}.",
    color: Color(1, 0.78, 0.15, 1, 0, 0, 0),
    weight: 1,
    uses: 4,
    applyEffect: (player, tear) => {
      tear.AddTearFlags(TearFlag.MIDAS);

      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (npc: EntityNPC) => {
        if (isMidasFreezable(npc) && rollChance(100, player.GetDropRNG())) {
          midasFreezeEnemy(npc, 3);
        }
      };
    },
  },
  [NotePickupSubType.HOMING]: {
    name: "Mystic Note",
    description: "Tears home in on enemies.",
    color: Color(0.65, 0.3, 0.9, 1, 0, 0, 0),
    weight: 2,
    uses: 3,
    applyEffect: (_player, tear) => {
      tear.AddTearFlags(TearFlag.HOMING);
    },
  },
  [NotePickupSubType.ERASER]: {
    name: "Rubber Note",
    description:
      "Permanently erases enemies.#{{Warning}} Doesn't work on Bosses.",
    color: Color(1, 0.35, 0.65, 1, 0, 0, 0),
    weight: 0.1,
    uses: 1,
    applyEffect: (player: EntityPlayer, tear: EntityTear) => {
      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (npc: EntityNPC) => {
        if (!isActiveEnemy(npc) || npc.IsBoss() || npc.IsInvincible()) {
          return;
        }

        const playerData = getData<TaintedMikuData>(player);
        playerData.erased ??= [];
        const key = getEnemyKey(npc);
        if (playerData.erased.includes(key)) {
          return;
        }

        playerData.erased.push(key);
        SFXManager().Play(SoundEffect.ERASER_HIT);
        const erased = eraseEnemies(npc.Type, npc.Variant);
        Debugger.char(
          player.GetName(),
          `Erased ${erased} enemies. (Type: ${npc.Type}, Variant: ${npc.Variant})`,
        );
      };
    },
  },
  [NotePickupSubType.ICE]: {
    name: "Freeze Note",
    description: "Freezes enemies temporarily.",
    color: Color(0.4, 0.85, 1, 1, 0, 0, 0),
    weight: 1,
    uses: 3,
    applyEffect: (_player: EntityPlayer, tear: EntityTear) => {
      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (enemy: EntityNPC) => {
        if (isFreezable(enemy)) {
          freezeEnemy(enemy, 3);
        }
      };
    },
  },
  [NotePickupSubType.FIRE]: {
    name: "Fiery Note",
    description:
      "{{Warning}} Burning enemies explode on death.#Burns enemies over time.",
    color: Color(1, 0.5, 0.15, 1, 0, 0, 0),
    weight: 1,
    uses: 2,
    applyEffect: (_player, tear) => {
      tear.AddTearFlags(TearFlag.BURN);
      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (enemy: EntityNPC) => {
        if (isBurnable(enemy)) {
          burnEnemy(enemy, 0.4, 3);
        }
      };
    },
  },
  // eslint-disable-next-line complete/require-unannotated-const-assertions
} as const;
