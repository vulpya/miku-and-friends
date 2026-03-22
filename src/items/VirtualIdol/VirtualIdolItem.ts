import type { CollectibleType, DamageFlag } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  getPlayerFromEntity,
  ModCallbackCustom,
} from "isaacscript-common";
import type { MikuPlayerData } from "../../characters/Miku/MikuCharacter";
import { MikuCharacter } from "../../characters/Miku/MikuCharacter";
import type { EIDExtended } from "../../compat/EID";
import { NoteTear } from "../../entities/tears/NoteTear";
import { Item } from "../Item";

const VIRTUAL_IDOL = {
  name: "Virtual Idol",
  type: Isaac.GetItemIdByName("Virtual Idol"),
  description:
    "Tears are now musical notes with a chance to charm enemies#sometimes enemies will be charmed permanently!",
} as const;

export class VirtualIdolItem extends Item {
  private readonly tear = new NoteTear();

  static getType(): CollectibleType {
    return VIRTUAL_IDOL.type;
  }

  get name(): string {
    return VIRTUAL_IDOL.name;
  }

  get type(): CollectibleType {
    return VirtualIdolItem.getType();
  }

  get description(): string {
    return VIRTUAL_IDOL.description;
  }

  @Callback(ModCallback.POST_TEAR_INIT)
  postTearInit(tear: EntityTear): void {
    const player = getPlayerFromEntity(tear);
    if (!player) {
      return;
    }

    if (player.GetPlayerType() === MikuCharacter.getType()) {
      const data = player.GetData() as MikuPlayerData;
      if (data.mikuHasIdol === false) {
        return;
      }
    } else if (!player.HasCollectible(this.type)) {
      return;
    }

    tear.ChangeVariant(this.tear.variant);
  }

  @CallbackCustom(ModCallbackCustom.POST_TEAR_KILL)
  postTearKill(tear: EntityTear): void {
    if (tear.Variant === this.tear.variant) {
      this.tear.splash(tear);
    }
  }

  @Callback(ModCallback.ENTITY_TAKE_DMG)
  entityTakeDamage(
    entity: Entity,
    _amount: float,
    _flags: BitFlags<DamageFlag>,
    source: EntityRef,
    _frames: int,
  ): boolean {
    if (!source.Entity) {
      return true;
    }

    const tear = source.Entity as EntityTear;
    if (tear.Variant === this.tear.variant) {
      return this.tear.onHit(entity, _amount, _flags, source, _frames);
    }

    return true;
  }

  override setupEID(eid: EIDExtended): void {
    eid.addCollectible(this.type, this.description, this.name);
  }
}
