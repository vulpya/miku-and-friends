import type { DamageFlag } from "isaac-typescript-definitions";
import {
  ActiveSlot,
  ButtonAction,
  CacheFlag,
  EntityFlag,
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
  getRandom,
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
import { CollectibleTypeCustom } from "../../items/enum";
import { mod } from "../../mod";
import { getData } from "../../util/data";
import { Debugger } from "../../util/debug";
import { setTearColor } from "../../util/effects";
import { eraseEnemies, getEnemyKey } from "../../util/enemies";
import { rollWeighted } from "../../util/rng";
import { SAVE_DATA } from "../../util/save";
import { Character } from "../Character";
import { isMiku, PlayerTypeCustom } from "../enum";

export interface TaintedMikuData {
  erased?: string[];
  notes?: NoteInstance[];
  useNotes?: boolean;
}

const NAME = "Miku";
const DESCRIPTION = "An idol twisted, using enemies as her melody.";
const BIRTHRIGHT_DESC = "TODO";
const HAIR = Isaac.GetCostumeIdByPath("gfx/characters/Character_MikuHead.anm2");
const POCKET_ACTIVE = CollectibleTypeCustom.BROKEN_VOICE;
const NOTE_DROP_CHANCE = 100;

export const MIKU_B_STATS = new ReadonlyMap<CacheFlag, number>([
  [CacheFlag.DAMAGE, 3.2],
  [CacheFlag.FIRE_DELAY, 2.25],
  [CacheFlag.LUCK, -1],
  [CacheFlag.COLOR, 2],
]);

export class MikuTaintedCharacter extends Character {
  /** Spritesheet with icons for HUD. */
  private noteSprite: Sprite | undefined = undefined;
  /** Spritesheet with icons for selected note display. */
  private activeNoteSprite: Sprite | undefined = undefined;
  /** Font for the uses text of the notes. */
  private font: Font | undefined = undefined;
  /** Map to track which player made the last hit on an enemy. */
  private readonly npcLastHitPlayer = new Map<Seed, PlayerIndex>();
  /** Tracker for hold input. */
  private readonly dropHoldFrames = new Map<PlayerIndex, int>();

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

      const { erased, notes } = playerData;

      SAVE_DATA.players[player.ControllerIndex.toString()] = {
        erased: erased ? [...erased] : [],
        notes: notes ? [...notes] : [],
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
    const playerData = getData<TaintedMikuData>(player);
    playerData.erased = [];
    playerData.notes = [];
    playerData.useNotes = false;

    player.AddNullCostume(HAIR);
    Debugger.char(`${NAME} (Tainted)`, `Applied null costume: ${HAIR}`);

    if (!player.HasCollectible(POCKET_ACTIVE)) {
      player.SetPocketActiveItem(POCKET_ACTIVE, ActiveSlot.POCKET, false);
      Debugger.char(NAME, "Give microphone pocket active item");
    }
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

    const playerData = getData<TaintedMikuData>(player);
    playerData.erased = saved.erased;
    playerData.notes = saved.notes;
    playerData.useNotes = saved.useNotes;
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PLAYER_UPDATE_REORDERED,
    PlayerVariant.PLAYER,
    PlayerTypeCustom.MIKU_B,
  )
  override postPlayerUpdate(player: EntityPlayer): void {
    const playerData = getData<TaintedMikuData>(player);
    const { notes, useNotes } = playerData;

    if (!notes || notes.length === 0) {
      return;
    }

    const isTapping = Input.IsActionTriggered(
      ButtonAction.DROP,
      player.ControllerIndex,
    );

    if (!(useNotes ?? false) && isTapping && notes.length > 1) {
      const firstNote = notes.shift();
      if (firstNote) {
        notes.push(firstNote);
      }

      SFXManager().Play(
        SoundEffect.SOUL_PICKUP,
        0.8,
        2,
        false,
        1 + (getRandom(player.GetDropRNG()) * 0.15 - 0.075),
      );
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
    const { notes, useNotes } = playerData;
    if ((useNotes ?? false) || !notes || notes.length === 0) {
      return;
    }

    const note = notes[0];
    if (!note) {
      return;
    }

    const noteData = NOTE_TYPE_DATA[note.subType];
    const tearData = getData<GlitchNoteTearData>(tear);

    tearData.color = noteData.color;
    noteData.applyEffect(player, tear);

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
      const playerData = getData<TaintedMikuData>(player);
      if (!playerData.erased) {
        return;
      }

      if (playerData.erased.includes(getEnemyKey(npc))) {
        const erased = eraseEnemies(npc.Type, npc.Variant);
        Debugger.char(NAME, `Erased ${erased} enemies.`);
      }
    }
  }

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
      const { notes, useNotes } = playerData;
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

      const RENDER_TEXT = false;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (RENDER_TEXT && !this.font) {
        this.font = Font();
        this.font.Load("font/pftempestasevencondensed.fnt");
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

        const baseColor =
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

        this.noteSprite.Color =
          (useNotes ?? false)
            ? Color(
                baseColor.R * 0.35,
                baseColor.G * 0.35,
                baseColor.B * 0.35,
                baseColor.A,
                0,
                0,
                0,
              )
            : baseColor;

        this.noteSprite.Render(Vector(x, y));
      }

      const game = Game();
      const hud = game.GetHUD();

      const isPausedCutscene =
        !hud.IsVisible() || game.GetRoom().GetFrameCount() < 5;

      // Render 'selected' note above player.
      const activeNote = notes[0];

      if (!(useNotes ?? false) && activeNote && !isPausedCutscene) {
        const noteConfig = NOTE_TYPE_DATA[activeNote.subType];
        const screenPos: Vector = Isaac.WorldToScreen(player.Position);

        const floatX = screenPos.X;
        const floatY = screenPos.Y - 50;

        const pulse = 1 + Math.sin(Game().GetFrameCount() * 0.2) * 0.08;
        const breath = 0.85 + Math.sin(Game().GetFrameCount() * 0.1) * 0.15;

        this.activeNoteSprite.Scale = Vector(pulse, pulse);

        const baseColor =
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

        this.activeNoteSprite.Color = Color(
          baseColor.R * breath,
          baseColor.G * breath,
          baseColor.B * breath,
          1,
          0,
          0,
          0,
        );

        this.activeNoteSprite.Render(Vector(floatX, floatY));

        if (this.font !== undefined) {
          const text = `${activeNote.remainingUses}`;
          const textScale = 0.5;
          const textX = floatX + 6;
          const textY = floatY + 6;

          // shadow
          this.font.DrawStringScaled(
            text,
            textX + 1,
            textY + 1,
            textScale,
            textScale,
            KColor(0, 0, 0, 1),
            0,
            true,
          );

          // main
          this.font.DrawStringScaled(
            text,
            textX,
            textY,
            textScale,
            textScale,
            KColor(1, 1, 1, 1),
            0,
            true,
          );
        }
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
      const tearData = getData<GlitchNoteTearData>(tear);
      if (tearData.onHitEnemy && isActiveEnemy(entity)) {
        tearData.onHitEnemy(entity as EntityNPC);
      }
    }

    if (!entity.HasEntityFlags(EntityFlag.NO_REWARD)) {
      this.npcLastHitPlayer.set(entity.InitSeed, getPlayerIndex(player));
    }

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
    const lastHit = this.npcLastHitPlayer.get(npc.InitSeed);
    this.npcLastHitPlayer.delete(npc.InitSeed);

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
      NOTE_DROP_CHANCE,
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
    eid.addCharacterInfo(PlayerTypeCustom.MIKU_B, DESCRIPTION, NAME);
    eid.addBirthright(PlayerTypeCustom.MIKU_B, BIRTHRIGHT_DESC, NAME);
    Debugger.eid(
      `${NAME} (Tainted)`,
      "Add description and birthright description.",
    );
  }
}
