import { SoundEffect, TearFlag } from "isaac-typescript-definitions";
import { arrayToBitFlags, isActiveEnemy } from "isaacscript-common";
import type { TaintedMikuData } from "../../../characters/Miku/MikuTaintedCharacter";
import { getData } from "../../../util/data";
import {
  charmEnemy,
  eraseEnemies,
  freezeEnemy,
  getEnemyKey,
  isCharmableEnemy,
  isFreezableEnemy,
} from "../../../util/enemies";
import type { GlitchNoteTearData } from "../../tears/GlitchNoteTear/GlitchNoteTear";
import type { NoteTypeConfig } from "./NotePickup";

/**
 * Represents the different subtypes of musical notes.
 *
 * Each subtype corresponds to a unique visual color and gameplay effect.
 */
export enum NotePickupSubType {
  /** Red Note – Charms enemies temporarily. */
  RED = 1,

  /** Blue Note – Laser-like tear shot that bounces. */
  BLUE,

  /** Green Note – Poisonous tear that can explode. */
  GREEN,

  /** Yellow Note – Causes fear, slowing enemies down. */
  YELLOW,

  /** Purple Note – Homing tears that track enemies. */
  PURPLE,

  /** Pink Note – Rubber eraser effect; permanently removes enemies. */
  PINK,

  /** Light Blue Note – Freezes enemies in place. */
  LIGHT_BLUE,

  /** Orange Note – Ignites enemies, causing burning damage. */
  ORANGE,
}

/**
 * Mapping of each `NotePickup` subtype to its configuration.
 *
 * Each config includes:
 * - Name and description for display and EID support.
 * - Color used for the pickup's sprite.
 * - Drop chance in percentage.
 * - Number of uses before depletion.
 * - The effect function that applies the note’s unique behavior to tears.
 */
export const NOTE_TYPE_CONFIGS: Record<NotePickupSubType, NoteTypeConfig> = {
  [NotePickupSubType.RED]: {
    name: "Love Note",
    description: "Charms enemies forever",
    color: Color(0.7, 0.2, 0.2, 1, 0, 0, 0),
    weight: 5,
    uses: 1,
    applyEffect: (_player: EntityPlayer, tear: EntityTear) => {
      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (enemy: EntityNPC) => {
        if (isCharmableEnemy(enemy)) {
          charmEnemy(enemy, 0, true);
        }
      };
    },
  },
  [NotePickupSubType.BLUE]: {
    name: "Blue Note",
    description: "no idea yet ;_;",
    color: Color(0.2, 0.3, 0.7, 1, 0, 0, 0),
    weight: 2,
    uses: 3,
    applyEffect: (_player, tear) => {
      tear.AddTearFlags(TearFlag.CREEP_TRAIL);
    },
  },
  [NotePickupSubType.GREEN]: {
    name: "Poison Note",
    description: "Poisons and explodes on impact",
    color: Color(0.2, 0.6, 0.2, 1, 0, 0, 0),
    weight: 5,
    uses: 1,
    applyEffect: (_player, tear) => {
      tear.AddTearFlags(arrayToBitFlags([TearFlag.POISON, TearFlag.EXPLOSIVE]));
    },
  },
  [NotePickupSubType.YELLOW]: {
    name: "Scary Note",
    description: "Slows and fears enemies",
    color: Color(0.7, 0.6, 0.2, 1, 0, 0, 0),
    weight: 20,
    uses: 4,
    applyEffect: (_player, tear) => {
      tear.AddTearFlags(TearFlag.SLOW);
    },
  },
  [NotePickupSubType.PURPLE]: {
    name: "Magic Note",
    description: "Homing tears that track enemies",
    color: Color(0.5, 0.2, 0.7, 1, 0, 0, 0),
    weight: 20,
    uses: 3,
    applyEffect: (_player, tear) => {
      tear.AddTearFlags(TearFlag.HOMING);
    },
  },
  [NotePickupSubType.PINK]: {
    name: "Rubber Note",
    description: "Permanently erases enemies from the run",
    color: Color(1, 0.4, 0.6, 1, 0, 0, 0),
    weight: 1,
    uses: 1,
    applyEffect: (player: EntityPlayer, tear: EntityTear) => {
      tear.AddTearFlags(TearFlag.BOUNCE);

      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (enemy: EntityNPC) => {
        if (!isActiveEnemy(enemy)) {
          return;
        }
        const mikuData = getData<TaintedMikuData>(player);
        mikuData.run ??= {};
        mikuData.run.erased ??= new Set<string>();

        const key = getEnemyKey(enemy);
        if (mikuData.run.erased.has(key)) {
          return;
        }

        mikuData.run.erased.add(key);
        SFXManager().Play(SoundEffect.ERASER_HIT);
        eraseEnemies(enemy.Type, enemy.Variant);
      };
    },
  },
  [NotePickupSubType.LIGHT_BLUE]: {
    name: "Freeze Note",
    description: "Freezes enemies in place temporarily",
    color: Color(0.5, 0.85, 1, 1, 0, 0, 0),
    weight: 25,
    uses: 3,
    applyEffect: (_player: EntityPlayer, tear: EntityTear) => {
      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (enemy: EntityNPC) => {
        if (isFreezableEnemy(enemy)) {
          freezeEnemy(enemy, 3 * 30);
        }
      };
    },
  },
  [NotePickupSubType.ORANGE]: {
    name: "Fiery Note",
    description: "Ignites enemies on contact",
    color: Color(1, 0.45, 0.1, 1, 0, 0, 0),
    weight: 15,
    uses: 3,
    applyEffect: (_player, tear) => {
      tear.AddTearFlags(TearFlag.BURN);
      const tearData = getData<GlitchNoteTearData>(tear);
      tearData.onHitEnemy = (enemy: EntityNPC) => {
        // TODO: Add helper function for burn enemy.
        enemy.AddBurn(EntityRef(enemy), 3 * 30, 0.4, true);
      };
    },
  },
  // eslint-disable-next-line complete/require-unannotated-const-assertions
} as const;
