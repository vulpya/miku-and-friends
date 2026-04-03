import type { DamageFlag } from "isaac-typescript-definitions";
import {
  CacheFlag,
  ModCallback,
  PlayerVariant,
} from "isaac-typescript-definitions";
import type { PlayerIndex, SaveData } from "isaacscript-common";
import {
  Callback,
  CallbackCustom,
  getPlayerFromEntity,
  getPlayerFromIndex,
  getPlayerIndex,
  getPlayersOfType,
  isActiveEnemy,
  jsonDecode,
  jsonEncode,
  ModCallbackCustom,
  ReadonlyMap,
} from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { spawnNotePickup } from "../../entities/pickups/helper";
import type { NoteInstance } from "../../entities/pickups/NotePickup/NotePickup";
import {
  NOTE_TYPE_DATA,
  NotePickupSubType,
} from "../../entities/pickups/NotePickup/NotePickupSubType";
import { TearVariantCustom } from "../../entities/tears/enum";
import type { GlitchNoteTearData } from "../../entities/tears/GlitchNoteTear/GlitchNoteTear";
import { mod } from "../../mod";
import { setTearColor } from "../../util";
import { getData } from "../../util/data";
import { Debugger } from "../../util/debug";
import { eraseEnemies, getEnemyKey } from "../../util/enemies";
import { rollWeighted } from "../../util/rng";
import { SAVE_DATA } from "../../util/save";
import { Character } from "../Character";
import { isMiku, PlayerTypeCustom } from "../enum";

const npcLastHitPlayer = new Map<Seed, PlayerIndex>();

export interface TaintedMikuData {
  persistent?: {
    erased?: string[];
    notes?: NoteInstance[];
  };
}

export interface SerializedTaintedMikuData {
  erased: string[];
  notes: Array<{
    subType: NotePickupSubType;
    remainingUses: number;
  }>;
}

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
  @CallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, true)
  override onGameStart(isContinued: boolean): void {
    if (!isContinued) {
      return;
    }

    if (!mod.HasData()) {
      return;
    }

    const loaded = jsonDecode(mod.LoadData()) as SaveData;

    print(loaded.persistent);

    Object.assign(SAVE_DATA, loaded);
  }

  @Callback(ModCallback.PRE_GAME_EXIT)
  override onGameExit(): void {
    SAVE_DATA.players = {};

    const players = getPlayersOfType(PlayerTypeCustom.MIKU_B);

    for (const player of players) {
      const playerIndex = getPlayerIndex(player);
      const playerData = getData<TaintedMikuData>(player);

      if (!playerData.persistent) {
        continue;
      }

      const { persistent } = playerData;

      SAVE_DATA.players[playerIndex.toString()] = {
        erased: persistent.erased ? [...persistent.erased] : [],

        notes: persistent.notes ?? [],
      };
    }

    mod.SaveData(jsonEncode(SAVE_DATA));
  }

  /**
   * Called after Tainted Miku is initialized the first time.
   *
   * Adds Tainted Miku's hair costume.
   *
   * @param player The player entity being initialized.
   */
  @CallbackCustom(
    ModCallbackCustom.POST_PLAYER_INIT_FIRST,
    PlayerVariant.PLAYER,
    PlayerTypeCustom.MIKU_B,
  )
  override postPlayerInitFirst(player: EntityPlayer): void {
    player.AddNullCostume(MIKU_TAINTED_CONFIG.costumes.hair);
    Debugger.char(
      `${MIKU_TAINTED_CONFIG.name} (Tainted)`,
      `applied null costume: ${MIKU_TAINTED_CONFIG.costumes.hair}`,
    );
  }

  /**
   * Called after Tainted Miku is initialized.
   *
   * Reads the mod save data to set the data for Miku on a continued run.
   *
   * @param player The player entity being initialized.
   */
  @Callback(ModCallback.POST_PLAYER_INIT, PlayerVariant.PLAYER)
  override postPlayerInit(player: EntityPlayer): void {
    if (!isMiku(player, true)) {
      return;
    }

    const playerIndex = getPlayerIndex(player);
    const saved = SAVE_DATA.players[playerIndex.toString()];
    if (!saved) {
      return;
    }

    const playerData = getData<TaintedMikuData>(player);
    playerData.persistent = {
      erased: saved.erased,
      notes: saved.notes,
    };
  }

  @Callback(ModCallback.POST_TEAR_INIT)
  override postTearInit(tear: EntityTear): void {
    const player = getPlayerFromEntity(tear);

    if (!player || !isMiku(player, true)) {
      return;
    }

    tear.ChangeVariant(TearVariantCustom.GLITCH_NOTE);

    const tearData = getData<GlitchNoteTearData>(tear);
    const rng = tear.GetDropRNG();

    setTearColor(tear, tearData, rng);
  }

  @Callback(ModCallback.POST_FIRE_TEAR)
  override postFireTear(tear: EntityTear): void {
    const player = getPlayerFromEntity(tear);
    if (!player || !isMiku(player, true)) {
      return;
    }

    const playerData = getData<TaintedMikuData>(player);
    const notes = playerData.persistent?.notes;

    if (!notes || notes.length === 0) {
      return;
    }

    const firstNote = notes[0];
    if (!firstNote) {
      return;
    }

    const noteSubType = firstNote.subType;
    const noteConfig = NOTE_TYPE_DATA[noteSubType];
    const tearData = getData<GlitchNoteTearData>(tear);

    tearData.color = noteConfig.color;
    noteConfig.applyEffect(player, tear);

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

    for (const player of players) {
      const mikuData = getData<TaintedMikuData>(player);
      if (!mikuData.persistent?.erased) {
        return;
      }

      if (mikuData.persistent.erased.includes(getEnemyKey(npc))) {
        const erased = eraseEnemies(npc.Type, npc.Variant);
        Debugger.char(MIKU_TAINTED_CONFIG.name, `Erased ${erased} enemies.`);
      }
    }
  }

  /** Spritesheet with icons for HUD. */
  private noteSprite: Sprite | undefined = undefined;

  @Callback(ModCallback.POST_RENDER)
  render(): void {
    const players = getPlayersOfType(PlayerTypeCustom.MIKU_B);
    if (players.length === 0) {
      return;
    }

    let notes: NoteInstance[] | undefined;
    for (const player of players) {
      const playerData = getData<TaintedMikuData>(player);
      notes = playerData.persistent?.notes;

      if (!notes || notes.length === 0) {
        continue;
      }
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

    if (!notes) {
      return;
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

      const noteConfig = NOTE_TYPE_DATA[note.subType];

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
      NOTE_SUBTYPES.map((s) => NOTE_TYPE_DATA[s].weight),
      rng,
      MIKU_TAINTED_CONFIG.noteDropChance,
    );

    Debugger.rng(
      "NoteDrop",
      `Rolled note for NPC ${npc.Type}_${npc.Variant}: ${
        note === undefined ? "None" : NOTE_TYPE_DATA[note].name
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
