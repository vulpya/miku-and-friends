import {
  EntityCollisionClass,
  EntityGridCollisionClass,
} from "isaac-typescript-definitions";
import { spawnPickup } from "isaacscript-common";
import { Debugger } from "../../util/debug";
import type { NotePickupSubType } from "./NotePickup/NotePickupSubType";
import { NOTE_TYPE_DATA } from "./NotePickup/NotePickupSubType";
import { PickupVariantCustom } from "./enum";

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
  const note = NOTE_TYPE_DATA[subType];

  const sprite = pickup.GetSprite();
  sprite.Color = note.color;

  pickup.GridCollisionClass = EntityGridCollisionClass.GROUND;
  pickup.EntityCollisionClass = EntityCollisionClass.PLAYER_OBJECTS;

  Debugger.pickup(
    "Note",
    `Spawned ${note.name} at (${position.X}, ${position.Y})`,
  );

  return pickup;
};
