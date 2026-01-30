import { BossTier } from 'utils';

export interface VillageOnMap {
    x: number;
    y: number;
    ownerUsername: string;
    villageName: string;
    clanName?: string;
}

export interface BossOnMap {
    id: string;
    x: number;
    y: number;
    tier: BossTier;
    name: string;
    currentHp: number;
    maxHp: number;
    claimedByClanId?: string;
    claimedByClanName?: string;
    expiresAt?: Date;
}

export interface MapWindowResponse {
    villages: VillageOnMap[];
    bosses: BossOnMap[];
    worldSize: number;
}

export interface MinimapResponse {
    villages: VillageOnMap[];
    bosses: BossOnMap[];
    worldSize: number;
}
