import type { DamageFlag } from "isaac-typescript-definitions";
import {
  CacheFlag,
  ModCallback,
  PlayerVariant,
} from "isaac-typescript-definitions";
import type { PlayerIndex } from "isaacscript-common";
import {
  Callback,
  CallbackCustom,
  getPlayerFromEntity,
  getPlayerFromIndex,
  getPlayerIndex,
  getPlayersOfType,
  isActiveEnemy,
  ModCallbackCustom,
  ReadonlyMap,
} from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { spawnNotePickup } from "../../entities/pickups/helper";
import type { NoteInstance } from "../../entities/pickups/NotePickup/NotePickup";
import {
  NOTE_TYPE_CONFIGS,
  NotePickupSubType,
} from "../../entities/pickups/NotePickup/NotePickupSubType";
import { TearVariantCustom } from "../../entities/tears/enum";
import type { GlitchNoteTearData } from "../../entities/tears/GlitchNoteTear/GlitchNoteTear";
import { setTearColor } from "../../util";
import { getData } from "../../util/data";
import { Debugger } from "../../util/debug";
import { eraseEnemies, getEnemyKey } from "../../util/enemies";
import { rollWeighted } from "../../util/rng";
import { Character } from "../Character";
import { isMiku, PlayerTypeCustom } from "../enum";

const npcLastHitPlayer = new Map<Seed, PlayerIndex>();

export interface TaintedMikuData {
  run?: {
    notes?: NoteInstance[];
    erased?: Set<string>;
  };
}

const data: TaintedMikuData = {
  run: {
    notes: [],
    erased: new Set(),
  },
};

const MIKU_TAINTED_CONFIG = {
  name: "Miku",
  description: "An idol twisted, using enemies as her melody.",
  birthrightDesc: "TODO",
  costumes: {
    hair: Isaac.GetCostumeIdByPath("gfx/characters/Character_MikuHead.anm2"),
  },
  noteDropChance: 50,
} as const;

export const MIKU_B_STATS = new ReadonlyMap<CacheFlag, number>([
  [CacheFlag.DAMAGE, 3.2],
  [CacheFlag.FIRE_DELAY, 2],
]);

export class MikuTaintedCharacter extends Character {
  v = data;

  /**
   * Called after Tainted Miku is initialized.
   *
   * Adds Miku's hair costume.
   *
   * @param player The player entity being initialized.
   * @see {@link EntityPlayer} The entity player class.
   */
  @CallbackCustom(
    ModCallbackCustom.POST_PLAYER_INIT_FIRST,
    PlayerVariant.PLAYER,
    PlayerTypeCustom.MIKU_B,
  )
  override postPlayerInit(player: EntityPlayer): void {
    this.v = getData(player);

    player.AddNullCostume(MIKU_TAINTED_CONFIG.costumes.hair);
    Debugger.char(
      `${MIKU_TAINTED_CONFIG.name} (Tainted)`,
      `applied null costume: ${MIKU_TAINTED_CONFIG.costumes.hair}`,
    );
  }

  @Callback(ModCallback.POST_TEAR_INIT)
  override postTearInit(tear: EntityTear): void {
    const player = getPlayerFromEntity(tear);

    if (!player || !isMiku(player, true)) {
      return;
    }

    tear.ChangeVariant(TearVariantCustom.GLITCH_NOTE);

    const tearData: GlitchNoteTearData = getData(tear);
    const rng = tear.GetDropRNG();

    setTearColor(tear, tearData, rng);
  }

  @Callback(ModCallback.POST_FIRE_TEAR)
  override postFireTear(tear: EntityTear): void {
    const player = getPlayerFromEntity(tear);
    if (!player || !isMiku(player, true)) {
      return;
    }

    const notes = this.v.run?.notes;
    if (!notes || notes.length === 0) {
      return;
    }

    const firstNote = notes[0];
    if (!firstNote) {
      return;
    }

    const noteSubType = firstNote.subType;
    const noteConfig = NOTE_TYPE_CONFIGS[noteSubType];
    const tearData: GlitchNoteTearData = getData(tear);

    tearData.color = noteConfig.color;

    noteConfig.applyEffect(player, tear);

    // Decrease remaining uses
    firstNote.remainingUses--;
    if (firstNote.remainingUses <= 0) {
      notes.shift();
    }
  }

  @Callback(ModCallback.POST_NPC_INIT)
  override postNPCInit(npc: EntityNPC): void {
    const players = getPlayersOfType(PlayerTypeCustom.MIKU_B);
    if (players.length === 0) {
      return;
    }

    // FIXME: Don't use non-null-assertion
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const mikuData: TaintedMikuData = getData(players[0]!);
    if (!mikuData.run?.erased) {
      return;
    }

    if (mikuData.run.erased.has(getEnemyKey(npc))) {
      eraseEnemies(npc.Type, npc.Variant);
    }
  }

  /** Sprite of this `NotePickup`. */
  private noteSprite: Sprite | undefined = undefined;

  @Callback(ModCallback.POST_RENDER)
  render(): void {
    const players = getPlayersOfType(PlayerTypeCustom.MIKU_B);
    if (players.length === 0) {
      return;
    }

    const notes = this.v.run?.notes;
    if (!notes || notes.length === 0) {
      return;
    }

    const startX = 45;
    const startY = 45;
    const spacing = 16;
    const baseSize = 14;
    const maxPerRow = 5;
    const maxRows = 2;
    const maxVisible = maxPerRow * maxRows;

    if (!this.noteSprite) {
      this.noteSprite = Sprite();
      this.noteSprite.Load("gfx/pickups/note.anm2", true);
      this.noteSprite.Play("Idle", true);
    }

    const [activeNote, ...restNotes] = notes.slice(-maxVisible);
    const notesToRender = [activeNote, ...restNotes];

    for (const [i, note] of notesToRender.entries()) {
      if (!note) {
        continue;
      }

      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;

      const x = startX + col * spacing;
      let y = startY + row * spacing;
      if (i === 0) {
        y += Math.sin(Game().GetFrameCount() * 0.1 + i);
      }

      const noteConfig = NOTE_TYPE_CONFIGS[note.subType];

      this.noteSprite.Scale = Vector(baseSize / 16, baseSize / 16);

      if (i === 0 && note.remainingUses < noteConfig.uses) {
        const ratio = note.remainingUses / noteConfig.uses;
        const dimmedColor = Color(
          noteConfig.color.R * ratio,
          noteConfig.color.G * ratio,
          noteConfig.color.B * ratio,
          noteConfig.color.A,
          0,
          0,
          0,
        );
        this.noteSprite.Color = dimmedColor;
      } else {
        this.noteSprite.Color = noteConfig.color;
      }

      this.noteSprite.Render(Vector(x, y));
    }
  }

  @Callback(ModCallback.ENTITY_TAKE_DMG)
  override entityTakeDamage(
    entity: Entity,
    _amount: float,
    _flags: BitFlags<DamageFlag>,
    source: EntityRef,
    _frames: int,
  ): boolean {
    if (!source.Entity) {
      return true;
    }

    const player = getPlayerFromEntity(source.Entity);
    if (!player) {
      return true;
    }

    const tear = source.Entity.ToTear();
    if (tear) {
      const data = getData<GlitchNoteTearData>(tear);
      if (data.onHitEnemy && isActiveEnemy(entity)) {
        data.onHitEnemy(entity as EntityNPC);
      }
    }

    npcLastHitPlayer.set(entity.InitSeed, getPlayerIndex(player));
    return true;
  }

  /**
   * Handles enemy death events for note drops.
   * - Rolls a note subtype based on weight and a general `noteDropChance`.
   * - Spawns the note pickup at the enemy's position if a roll succeeds.
   *
   * @param npc The NPC entity that died.
   */
  @Callback(ModCallback.POST_NPC_DEATH)
  override postNPCDeath(npc: EntityNPC): void {
    const lastHit = npcLastHitPlayer.get(npc.InitSeed);
    npcLastHitPlayer.delete(npc.InitSeed);

    if (lastHit === undefined) {
      return;
    }

    const player = getPlayerFromIndex(lastHit);
    if (!player || !isMiku(player, true) || !npc.IsEnemy()) {
      return;
    }

    const rng = npc.GetDropRNG();
    const NOTE_SUBTYPES: readonly NotePickupSubType[] = Object.values(
      NotePickupSubType,
    ).filter((v): v is NotePickupSubType => typeof v === "number");

    const note = rollWeighted(
      NOTE_SUBTYPES,
      NOTE_SUBTYPES.map((s) => NOTE_TYPE_CONFIGS[s].weight),
      rng,
      MIKU_TAINTED_CONFIG.noteDropChance,
    );

    Debugger.rng(
      "NoteDrop",
      `Rolled note for NPC ${npc.Type}_${npc.Variant}: ${
        note === undefined ? "None" : NOTE_TYPE_CONFIGS[note].name
      }`,
    );

    if (note === undefined) {
      /* empty */
    } else {
      spawnNotePickup(note, npc.Position);
    }
  }

  /**
   * Sets up **External Item Descriptions (EID)** compatibility for Tainted Miku.
   *
   * This method registers the player icon, character info, and birthright description with EID, so
   * that in-game tooltips display properly for Miku.
   *
   * @param eid The `EIDExtended` instance used to add compatibility.
   * @see {@link EIDExtended}
   */
  override setupEID(eid: EIDExtended): void {
    const icons = Sprite();
    icons.Load("gfx/player_icons.anm2", true);
    eid.addIcon(
      `Player${PlayerTypeCustom.MIKU_B}`,
      "Players",
      0,
      16,
      16,
      0,
      0,
      icons,
    );
    eid.addCharacterInfo(
      PlayerTypeCustom.MIKU_B,
      MIKU_TAINTED_CONFIG.description,
      MIKU_TAINTED_CONFIG.name,
    );
    eid.addBirthright(
      PlayerTypeCustom.MIKU_B,
      MIKU_TAINTED_CONFIG.birthrightDesc,
      MIKU_TAINTED_CONFIG.name,
    );
    Debugger.char(
      `${MIKU_TAINTED_CONFIG.name} (Tainted)`,
      "Setup EID compatibility",
    );
  }
}
