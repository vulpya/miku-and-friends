import type { DamageFlag } from "isaac-typescript-definitions";
import {
  ButtonAction,
  CacheFlag,
  ModCallback,
  PlayerVariant,
  SoundEffect,
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
import { getWobbleOffset } from "../../entities/tears/helper";
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
  notes: NoteInstance[];
}

const MIKU_TAINTED_CONFIG = {
  name: "Miku",
  description: "An idol twisted, using enemies as her melody.",
  birthrightDesc: "TODO",
  costumes: {
    hair: Isaac.GetCostumeIdByPath("gfx/characters/Character_MikuHead.anm2"),
  },
  noteDropChance: 100,
} as const;

export const MIKU_B_STATS = new ReadonlyMap<CacheFlag, number>([
  [CacheFlag.DAMAGE, 3.2],
  [CacheFlag.FIRE_DELAY, 3],
]);

export class MikuTaintedCharacter extends Character {
  @CallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, true)
  override onGameStart(isContinued: boolean): void {
    if (!isContinued || !mod.HasData()) {
      return;
    }

    const loaded = jsonDecode(mod.LoadData()) as SaveData;

    Object.assign(SAVE_DATA, loaded);
  }

  @Callback(ModCallback.PRE_GAME_EXIT)
  override onGameExit(): void {
    SAVE_DATA.players = {};

    const players = getPlayersOfType(PlayerTypeCustom.MIKU_B);

    for (const player of players) {
      const playerData = getData<TaintedMikuData>(player);

      if (!playerData.persistent) {
        continue;
      }

      const { erased, notes } = playerData.persistent;

      const serializedNotes = (notes ?? []).map((note) => ({
        subType: note.subType,
        remainingUses: note.remainingUses,
      }));

      SAVE_DATA.players[player.ControllerIndex.toString()] = {
        erased: erased ? [...erased] : [],
        notes: serializedNotes,
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
   * Reads the mod save data to set the data for Tainted Miku on a continued run.
   *
   * @param player The player entity being initialized.
   */
  @Callback(ModCallback.POST_PLAYER_INIT, PlayerVariant.PLAYER)
  override postPlayerInit(player: EntityPlayer): void {
    if (!isMiku(player, true)) {
      return;
    }

    const saved = SAVE_DATA.players[player.ControllerIndex.toString()];
    if (!saved) {
      return;
    }

    const deserializedNotes: NoteInstance[] = saved.notes.map((n) => ({
      subType: n.subType,
      remainingUses: n.remainingUses,
    }));

    const playerData = getData<TaintedMikuData>(player);
    playerData.persistent = {
      erased: [...saved.erased],
      notes: deserializedNotes,
    };
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PLAYER_UPDATE_REORDERED,
    PlayerVariant.PLAYER,
    PlayerTypeCustom.MIKU_B,
  )
  override postPlayerUpdate(player: EntityPlayer): void {
    const playerData = getData<TaintedMikuData>(player);
    const notes = playerData.persistent?.notes;
    if (!notes || notes.length <= 1) {
      return;
    }

    if (Input.IsActionTriggered(ButtonAction.DROP, player.ControllerIndex)) {
      const firstNote = notes.shift();
      if (firstNote) {
        notes.push(firstNote);
      }

      SFXManager().Play(SoundEffect.COIN_SLOT);
    }
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

    const note = notes[0];
    if (!note) {
      return;
    }

    const noteConfig = NOTE_TYPE_DATA[note.subType];
    const tearData = getData<GlitchNoteTearData>(tear);

    tearData.color = noteConfig.color;
    noteConfig.applyEffect(player, tear);

    note.remainingUses--;
    if (note.remainingUses <= 0) {
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
  /** Spritesheet with icons for selected note display. */
  private activeNoteSprite: Sprite | undefined = undefined;

  @Callback(ModCallback.POST_RENDER)
  render(): void {
    const players = getPlayersOfType(PlayerTypeCustom.MIKU_B);
    if (players.length === 0) {
      return;
    }

    const controllerSides: Record<number, boolean> = {
      0: false, // player 1 - left
      1: true, // player 2 - right
      2: false, // player 3 - left
      3: true, // player 4 - right
    };

    for (const player of players) {
      const playerData = getData<TaintedMikuData>(player);
      const notes = playerData.persistent?.notes;
      if (!notes || notes.length === 0) {
        continue;
      }

      // Determine HUD side
      const index = player.ControllerIndex;
      const isRightSide = controllerSides[index] ?? false;

      // HUD layout config
      const startX = isRightSide ? 300 : 45;
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

      if (!this.activeNoteSprite) {
        this.activeNoteSprite = Sprite();
        this.activeNoteSprite.Load("gfx/pickups/note.anm2", true);
        this.activeNoteSprite.Play("Idle", true);
      }

      // Render notes HUD
      const visibleNotes = notes.slice(0, maxVisible);
      for (const [i, note] of visibleNotes.entries()) {
        const row = Math.floor(i / maxPerRow);
        const col = i % maxPerRow;
        const x = startX + col * spacing;
        const y = startY + row * spacing;

        const noteConfig = NOTE_TYPE_DATA[note.subType];
        this.noteSprite.Scale =
          i === 0
            ? Vector((baseSize / 16) * 1.2, (baseSize / 16) * 1.2)
            : Vector(baseSize / 16, baseSize / 16);

        this.noteSprite.Color =
          note.remainingUses < noteConfig.uses
            ? Color(
                noteConfig.color.R * (note.remainingUses / noteConfig.uses),
                noteConfig.color.G * (note.remainingUses / noteConfig.uses),
                noteConfig.color.B * (note.remainingUses / noteConfig.uses),
                noteConfig.color.A,
                0,
                0,
                0,
              )
            : noteConfig.color;

        this.noteSprite.Render(Vector(x, y));
      }

      // Render active note above player.
      const activeNote = notes[0];
      if (activeNote) {
        const noteConfig = NOTE_TYPE_DATA[activeNote.subType];
        const screenPos: Vector = Isaac.WorldToScreen(player.Position);

        const floatX = screenPos.X;
        const floatY = screenPos.Y - 50 + getWobbleOffset(0, 5, 0.05); // subtle wobble

        this.activeNoteSprite.Scale = Vector(1, 1);
        this.activeNoteSprite.Color =
          activeNote.remainingUses < noteConfig.uses
            ? Color(
                noteConfig.color.R
                  * (activeNote.remainingUses / noteConfig.uses),
                noteConfig.color.G
                  * (activeNote.remainingUses / noteConfig.uses),
                noteConfig.color.B
                  * (activeNote.remainingUses / noteConfig.uses),
                noteConfig.color.A,
                0,
                0,
                0,
              )
            : noteConfig.color;

        this.activeNoteSprite.Render(Vector(floatX, floatY));
      }
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
