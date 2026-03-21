import type {
  CacheFlag,
  CollectibleType,
  DamageFlag,
  PlayerType,
  TearFlag,
} from "isaac-typescript-definitions";
import { addTearsStat, bitFlags } from "isaacscript-common";
import type { EIDExtended } from "../compat/EID";

/** Configuration used to define a character. */
export interface CharacterConfig {
  /** The name of the character. */
  name: string;

  /** Type of the character. */
  type: PlayerType;

  /** Description of the character (Used for EID). */
  description: string;

  /** Description of the Birthright Effect of the character (Used for EID). */
  birthrightDesc: string;

  /** Whether this is the tainted version of the character. */
  tainted?: boolean;

  /** Base movement speed bonus. */
  moveSpeed?: number;

  /** Base damage bonus. */
  damage?: number;

  /** Base tears bonus. */
  tears?: number;

  /** Base luck bonus. */
  luck?: number;

  /** Base tear flags. */
  tearFlags?: TearFlag | BitFlags<TearFlag>;

  /** Active pocket item for character. */
  pocketActive?: CollectibleType;
}

/** Abstract base class representing a custom character. */
export abstract class Character<T extends CharacterConfig = CharacterConfig> {
  /** Character configuration. */
  protected readonly config: T;

  /**
   * Creates a new character definition.
   *
   * @param config Character configuration.
   */
  constructor(config: T) {
    this.config = config;
    if (this.setupEID) {
      const ExEID = EID as EIDExtended | undefined;
      if (ExEID) {
        this.setupEID(ExEID);
      }
    }
  }

  get name(): string {
    return this.config.name;
  }

  get type(): PlayerType {
    return this.config.type;
  }

  get description(): string {
    return this.config.description;
  }

  get birthright(): string {
    return this.config.birthrightDesc;
  }

  get moveSpeed(): number | undefined {
    return this.config.moveSpeed;
  }

  get damage(): number | undefined {
    return this.config.damage;
  }

  get tears(): number | undefined {
    return this.config.tears;
  }

  get luck(): number | undefined {
    return this.config.luck;
  }

  get tearFlags(): TearFlag | BitFlags<TearFlag> | undefined {
    return this.config.tearFlags;
  }

  get pocketActive(): CollectibleType | undefined {
    return this.config.pocketActive;
  }

  /**
   * Checks whether the provided player matches this character type.
   *
   * @param player The player entity to check.
   * @returns `true` if the player is this character type.
   */
  isPlayer(player: EntityPlayer): boolean {
    return player.GetPlayerType() === this.config.type;
  }

  /**
   * Applies base stat bonuses when the game evaluates cache flags.
   *
   * @param player The player entity being evaluated.
   * @param flag The cache flag currently being processed.
   */
  onCache?(player: EntityPlayer, flag: CacheFlag): void;

  /**
   * Applies base stat bonuses when the game evaluates `Damage` cache flag.
   *
   * @param player The player entity being evaluated.
   * @see {@link EntityPlayer} - The entity player class.
   */
  onEvaluateDamage(player: EntityPlayer): void {
    player.Damage += this.config.damage ?? 0;
  }

  /**
   * Applies base stat bonuses when the game evaluates `Speed` cache flag.
   *
   * @param player The player entity being evaluated.
   * @see {@link EntityPlayer} - The entity player class.
   */
  onEvaluateSpeed(player: EntityPlayer): void {
    player.MoveSpeed += this.config.moveSpeed ?? 0;
  }

  /**
   * Applies base stat bonuses when the game evaluates `Luck` cache flag.
   *
   * @param player The player entity being evaluated.
   * @see {@link EntityPlayer} - The entity player class.
   */
  onEvaluateLuck(player: EntityPlayer): void {
    player.Luck += this.config.luck ?? 0;
  }

  /**
   * Applies base stat bonuses when the game evaluates `FireDelay` cache flag.
   *
   * @param player The player entity being evaluated.
   * @see {@link EntityPlayer} - The entity player class.
   */
  onEvaluateFireDelay(player: EntityPlayer): void {
    addTearsStat(player, this.config.tears ?? 0);
  }

  /**
   * Applies base tear flags when the game evaluates `TearFlag` cache flag.
   *
   * @param player The player entity being evaluated.
   * @see {@link EntityPlayer} - The entity player class.
   */
  onEvaluateTearFlags(player: EntityPlayer): void {
    if (this.config.tearFlags) {
      player.TearFlags = bitFlags(this.config.tearFlags);
    }
  }

  /** Hook called after the player is initialized. */
  onPostPlayerInit?(player: EntityPlayer): void;

  /** Hook called during reordered player effect updates. */
  onPostPEffectUpdateReordered?(player: EntityPlayer): void;

  /** Hook called after tear entity finished spawning. */
  onPostTearInit?(tear: EntityTear): void;

  /** Hook called every time the tear updates. */
  onPostTearUpdate?(tear: EntityTear): void;

  /** Hook called after tear collides with an entity or grid. */
  onPostTearKill?(tear: EntityTear): void;

  /** Hook called when enemy takes damage. */
  onEntityTakeDamage?(
    entity: Entity,
    amount: float,
    damageFlags: BitFlags<DamageFlag>,
    source: EntityRef,
    countdownFrames: int,
  ): boolean;

  /**
   * Sets up **External Item Descriptions (EID)** compatibility for a custom character.
   *
   * @param eid The `EIDExtended` instance used to add compatibility.
   * @see {@link EIDExtended}
   */
  setupEID?(eid: EIDExtended): void;
}
