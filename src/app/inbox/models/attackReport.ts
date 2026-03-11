import { ResourcesAmounts } from "src/app/main-panel/models/resourcesAmounts";
import { TroopsAmounts } from "src/app/main-panel/models/troopsAmounts";

export type BossReportType = 'pvp' | 'boss' | 'spy' | 'oasis';

export interface AttackReport {
    id: string;
    attackerName: string;
    attackerVillageName: string;

    defenderName: string;
    defenderVillageName: string;

    date: Date;
    attackerWon: boolean;
    lootedResources: ResourcesAmounts;

    attackerTotalAttack: number;
    defenderTotalDefence: number; // defenderTotalArmyDefence + defenderTotalSupportArmyDefence + wallDefence
    defenderTotalArmyDefence: number;
    defenderTotalSupportArmyDefence: number;
    wallDefence: number;

    attackerTroops: TroopsAmounts;
    attackerLostTroops: TroopsAmounts;
    defenderTotalTroops: TroopsAmounts;
    defenderTotalLostTroops: TroopsAmounts;
    supportTotalTroops: TroopsAmounts;
    supportTotalLostTroops: TroopsAmounts;

    read: boolean;

    reportType: BossReportType;
    bossName?: string;
    bossTier?: string;
    bossHpBefore?: number;
    bossHpAfter?: number;
    bossMaxHp?: number;
    bossDamageDealt?: number;
    bossReward?: ResourcesAmounts;
    bossRelicId?: string;
    bossRelicName?: string;
} 