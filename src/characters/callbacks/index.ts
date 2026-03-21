import type { ModUpgraded } from "isaacscript-common";
import { registerEvaluateDamageCallback } from "./cache/onEvaluateDamageCallback";
import { registerEvaluateFireDelayCallback } from "./cache/onEvaluateFIreDelayCallback";
import { registerEvaluateLuckCallback } from "./cache/onEvaluateLuckCallback";
import { registerEvaluateSpeedCallback } from "./cache/onEvaluateSpeedCallback";
import { registerEvaluateTearFlagCallback } from "./cache/onEvaluateTearFlagCallback";
import { registerOnEntityTakeDamage } from "./onEntityTakeDamage";
import { registerPostPEffectUpdateReordered } from "./onPostPEffectUpdateReordered";
import { registerPostPlayerInitCallback } from "./onPostPlayerInit";
import { registerPostTearInit } from "./onPostTearInit";
import { registerPostTearKill } from "./onPostTearKill";

const registerCache = (mod: ModUpgraded) => {
  registerEvaluateDamageCallback(mod);
  registerEvaluateSpeedCallback(mod);
  registerEvaluateLuckCallback(mod);
  registerEvaluateTearFlagCallback(mod);
  registerEvaluateFireDelayCallback(mod);
};

export const registerCharacterCallbacks = (mod: ModUpgraded): void => {
  registerCache(mod);

  registerPostPlayerInitCallback(mod);
  registerPostPEffectUpdateReordered(mod);
  registerPostTearInit(mod);
  registerPostTearKill(mod);
  registerOnEntityTakeDamage(mod);
};
