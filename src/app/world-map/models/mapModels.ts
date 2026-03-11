import { BossTier, OasisTier } from 'utils';

export interface VillageOnMap {
    x: number;
    y: number;
    ownerUsername: string;
    villageName: string;
    clanName?: string;
    quartersLevel?: number;
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
    relicId?: string;
    relicName?: string;
}

export interface OasisOnMap {
    id: string;
    x: number;
    y: number;
    tier?: OasisTier;
}

export interface MapWindowResponse {
    villages: VillageOnMap[];
    bosses: BossOnMap[];
    oases?: OasisOnMap[];
    worldSize: number;
}

export interface MinimapResponse {
    villages: VillageOnMap[];
    bosses: BossOnMap[];
    oases?: OasisOnMap[];
    worldSize: number;
}
