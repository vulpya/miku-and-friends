import { ModCallback } from "isaac-typescript-definitions";
import { Callback, getPlayerFromEntity } from "isaacscript-common";
import type { EIDExtended } from "../../compat/EID";
import { TearVariantCustom } from "../../entities/tears/enum";
import { Debugger } from "../../util/debug";
import { Character } from "../Character";
import { isMiku, PlayerTypeCustom } from "../enum";

const MIKU_TAINTED_CONFIG = {
  name: "Miku",
  type: Isaac.GetPlayerTypeByName("Miku", true),
  description: "TODO",
  birthrightDesc: "TODO",
  costumes: {
    hair: Isaac.GetCostumeIdByPath("gfx/characters/Character_MikuHead.anm2"),
  },
} as const;

export class MikuTaintedCharacter extends Character {
  /**
   * Called after Tainted Miku is initialized.
   *
   * Adds Miku's hair costume.
   *
   * @param player The player entity being initialized.
   * @see {@link EntityPlayer} The entity player class.
   */
  @Callback(ModCallback.POST_PLAYER_INIT)
  override postPlayerInit(player: EntityPlayer): void {
    if (!isMiku(player, true)) {
      return;
    }

    player.AddNullCostume(MIKU_TAINTED_CONFIG.costumes.hair);
    Debugger.char(
      MIKU_TAINTED_CONFIG.name,
      `Tainted: applied null costume: ${MIKU_TAINTED_CONFIG.costumes.hair}`,
    );
  }

  @Callback(ModCallback.POST_TEAR_INIT)
  override postTearInit(tear: EntityTear): void {
    const player = getPlayerFromEntity(tear);
    if (!player || !isMiku(player, true)) {
      return;
    }

    tear.ChangeVariant(TearVariantCustom.GLITCH_NOTE);
  }

  /**
   * Sets up **External Item Descriptions (EID)** compatibility for Miku.
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
