import type { SerializedTaintedMikuData } from "../characters/Miku/MikuTaintedCharacter";

interface ModSaveData {
  players: Record<string, SerializedTaintedMikuData>;
}

export const SAVE_DATA: ModSaveData = {
  players: {},
  // eslint-disable-next-line complete/require-unannotated-const-assertions
} as const;
