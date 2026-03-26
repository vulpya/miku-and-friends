import { ISCFeature, upgradeMod } from "isaacscript-common";

export const MOD_NAME = "Miku & Friends";

const ISC_FEATURES = [ISCFeature.SAVE_DATA_MANAGER] as const;

const modVanilla = RegisterMod(MOD_NAME, 1);
export const mod = upgradeMod(modVanilla, ISC_FEATURES);
