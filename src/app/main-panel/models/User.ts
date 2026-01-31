import { Village } from "./Village";

export interface PendingBossReward {
    bossName: string;
    defeatedAt: Date;
    rewards: {
        wood: number;
        stone: number;
        crop: number;
    };
}

export class User
{
    username!: string;
    joinDate!: Date;
    clanName!: string;
    villages!: Village[];
    energy!: number;
    pendingClanRequests!: string[];
    currentQuestIndex!: number;
    pendingBossRewards!: PendingBossReward[];
}