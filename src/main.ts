import { initModFeatures, isRepentogon } from "isaacscript-common";
import { version } from "../package.json";
import { MikuCharacter } from "./characters/Miku/MikuCharacter";
import { MikuTaintedCharacter } from "./characters/Miku/MikuTaintedCharacter";
import { GlitchNoteTear } from "./entities/tears/GlitchNoteTear/GlitchNoteTear";
import { MusicalNoteTear } from "./entities/tears/MusicalNoteTear/MusicalNoteTear";
import { MicrophoneItem } from "./items/Microphone/MicrophoneItem";
import { VirtualIdolItem } from "./items/VirtualIdol/VirtualIdolItem";
import { mod, MOD_NAME } from "./mod";

const PASSIVE_ITEMS = [VirtualIdolItem] as const;

const ACTIVE_ITEMS = [MicrophoneItem] as const;

const TEARS = [MusicalNoteTear, GlitchNoteTear] as const;

const CHARACTERS = [MikuCharacter, MikuTaintedCharacter] as const;

export const main = (): void => {
  initModFeatures(mod, [
    ...PASSIVE_ITEMS,
    ...ACTIVE_ITEMS,
    ...TEARS,
    ...CHARACTERS,
  ]);

  if (isRepentogon()) {
    print(`\n${MOD_NAME} v${version} loaded. [REPENTOGON]`);
  } else {
    print(`\n${MOD_NAME} v${version} loaded.`);
  }
};
