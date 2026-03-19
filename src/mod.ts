import { upgradeMod } from "isaacscript-common";

export const MOD_NAME = "Miku & Friends";

const modVanilla = RegisterMod(MOD_NAME, 1);
export const mod = upgradeMod(modVanilla);
