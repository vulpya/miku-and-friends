import { initModFeatures, isRepentogon } from "isaacscript-common";
import { version } from "../package.json";
import { MikuCharacter } from "./characters/Miku/MikuCharacter";
import { MicrophoneItem } from "./items/Microphone/MicrophoneItem";
import { VirtualIdolItem } from "./items/VirtualIdol/VirtualIdolItem";
import { mod, MOD_NAME } from "./mod";

const PASSIVE_ITEMS = [VirtualIdolItem] as const;

const ACTIVE_ITEMS = [MicrophoneItem] as const;

const CHARACTERS = [MikuCharacter] as const;

export const main = (): void => {
  initModFeatures(mod, [...PASSIVE_ITEMS, ...ACTIVE_ITEMS, ...CHARACTERS]);

  if (isRepentogon()) {
    print(`\n${MOD_NAME} v${version} loaded. [REPENTOGON]`);
  } else {
    print(`\n${MOD_NAME} v${version} loaded.`);
  }
};
