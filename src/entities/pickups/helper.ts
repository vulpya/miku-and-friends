import {
  EntityCollisionClass,
  EntityGridCollisionClass,
} from "isaac-typescript-definitions";
import { spawnPickup } from "isaacscript-common";
import { Debugger } from "../../util/debug";
import { PickupVariantCustom } from "./enum";
import type { NotePickupSubType } from "./NotePickup/NotePickupSubType";
import { NOTE_TYPE_CONFIGS } from "./NotePickup/NotePickupSubType";

/**
 * Spawns a colored `NotePickup` at the specified position.
 *
 * @param subType The subtype of the note.
 * @param position The position in the room to spawn the pickup.
 * @returns The spawned pickup entity, or undefined if spawning failed.
 */
export const spawnNotePickup = (
  subType: NotePickupSubType,
  position: Vector,
): EntityPickup => {
  const pickup = spawnPickup(PickupVariantCustom.NOTE, subType, position);

  const sprite = pickup.GetSprite();
  sprite.Color = NOTE_TYPE_CONFIGS[subType].color;

  pickup.GridCollisionClass = EntityGridCollisionClass.GROUND;
  pickup.EntityCollisionClass = EntityCollisionClass.PLAYER_OBJECTS;

  Debugger.pickup(
    "NotePickup",
    `Spawned ${NOTE_TYPE_CONFIGS[subType].name} at (${position.X}, ${position.Y})`,
  );

  return pickup;
};
