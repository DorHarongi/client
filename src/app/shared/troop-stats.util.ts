import {
  archerAttackingStat,
  archerDefenceStat,
  axeFighterAttackingStat,
  axeFighterDefenceStat,
  catapultsAttackingStat,
  catapultsDefenceStat,
  getSkillBonus,
  horsemenAttackingStat,
  horsemenDefenceStat,
  magicianAttackingStat,
  magicianDefenceStat,
  SkillCategory,
  spearFighterAttackingStat,
  spearFighterDefenceStat,
  swordFighterAttackingStat,
  swordFighterDefenceStat,
} from 'utils';

export interface TroopStatsInput {
  spearFighters?: number;
  swordFighters?: number;
  axeFighters?: number;
  archers?: number;
  magicians?: number;
  horsemen?: number;
  catapults?: number;
}

export interface TroopStatsResult {
  baseAttack: number;
  baseDefense: number;
  effectiveAttack: number;
  effectiveDefense: number;
}

export interface TroopStatsOptions {
  skills?: any;
  applyAttackSkillBonus?: boolean;
  applyDefenseSkillBonus?: boolean;
  attackSkillBonus?: number;
  defenseSkillBonus?: number;
  attackMultiplier?: number;
  defenseMultiplier?: number;
}

function safe(value: number | undefined): number {
  return value || 0;
}

export function calculateTroopStats(
  troops: TroopStatsInput | null | undefined,
  options?: TroopStatsOptions,
): TroopStatsResult {
  if (!troops) {
    return {
      baseAttack: 0,
      baseDefense: 0,
      effectiveAttack: 0,
      effectiveDefense: 0,
    };
  }

  const baseAttack =
    safe(troops.spearFighters) * spearFighterAttackingStat +
    safe(troops.swordFighters) * swordFighterAttackingStat +
    safe(troops.axeFighters) * axeFighterAttackingStat +
    safe(troops.archers) * archerAttackingStat +
    safe(troops.magicians) * magicianAttackingStat +
    safe(troops.horsemen) * horsemenAttackingStat +
    safe(troops.catapults) * catapultsAttackingStat;

  const baseDefense =
    safe(troops.spearFighters) * spearFighterDefenceStat +
    safe(troops.swordFighters) * swordFighterDefenceStat +
    safe(troops.axeFighters) * axeFighterDefenceStat +
    safe(troops.archers) * archerDefenceStat +
    safe(troops.magicians) * magicianDefenceStat +
    safe(troops.horsemen) * horsemenDefenceStat +
    safe(troops.catapults) * catapultsDefenceStat;

  const skills = options?.skills;
  const attackSkillBonus =
    options?.attackSkillBonus ??
    (options?.applyAttackSkillBonus && skills
      ? getSkillBonus(skills, SkillCategory.SHARPER_BLADES)
      : 0);
  const defenseSkillBonus =
    options?.defenseSkillBonus ??
    (options?.applyDefenseSkillBonus && skills
      ? getSkillBonus(skills, SkillCategory.HEROIC_SHIELD)
      : 0);
  const attackMultiplier = options?.attackMultiplier || 1;
  const defenseMultiplier = options?.defenseMultiplier || 1;

  const effectiveAttack = Math.floor(
    baseAttack * (1 + attackSkillBonus) * attackMultiplier,
  );
  const effectiveDefense = Math.floor(
    baseDefense * (1 + defenseSkillBonus) * defenseMultiplier,
  );

  return {
    baseAttack,
    baseDefense,
    effectiveAttack,
    effectiveDefense,
  };
}
