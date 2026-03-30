import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BossOnMap } from '../models/mapModels';
import { BossTier, getDistanceDamageMultiplier, getDistanceBonusText, bossMinimapColors, CLAIMED_BOSS_COLOR, bossImages } from 'utils';

export interface TroopsAmounts {
    spearFighters: number;
    swordFighters: number;
    axeFighters: number;
    archers: number;
    magicians: number;
    horsemen: number;
    catapults: number;
    spies: number;
}

export interface RaidReport {
    id: string;
    attackerUsername: string;
    attackerVillageName: string;
    attackerClanName: string;
    bossId: string;
    bossName: string;
    bossTier: BossTier;
    bossX: number;
    bossY: number;
    date: Date;
    attackerTroops: TroopsAmounts;
    attackerLostTroops: TroopsAmounts;
    rawDamage: number;
    distanceMultiplier: number;
    actualDamage: number;
    bossHpBefore: number;
    bossHpAfter: number;
    bossMaxHp: number;
    distanceFromVillage: number;
    read: boolean;
}

export interface BossAttackResult {
    report: RaidReport;
    bossDefeated: boolean;
    rewards?: {
        wood: number;
        stone: number;
        crop: number;
    };
}

export interface AttackBossDTO {
    bossId: string;
    villageName: string;
    troops: TroopsAmounts;
}

@Injectable({
    providedIn: 'root'
})
export class BossService {

    constructor(private http: HttpClient) { }

    attackBoss(username: string, dto: AttackBossDTO): Observable<{ travelTimeMs: number }> {
        return this.http.post<{ travelTimeMs: number }>(`${environment.apiUrl}/bosses/attack/${username}`, dto);
    }

    getBossDamageLeaderboard(bossId: string): Observable<{ clanName: string; totalDamage: number; players: { username: string; damage: number }[] }[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/bosses/damage-leaderboard/${bossId}`);
    }

    getAllBosses(): Observable<BossOnMap[]> {
        return this.http.get<BossOnMap[]>(`${environment.apiUrl}/bosses`);
    }

    // Get specific boss
    getBoss(bossId: string): Observable<BossOnMap> {
        return this.http.get<BossOnMap>(`${environment.apiUrl}/bosses/${bossId}`);
    }

    // Get raid reports for a user
    getRaidReports(username: string, page: number): Observable<RaidReport[]> {
        return this.http.get<RaidReport[]>(`${environment.apiUrl}/bosses/reports/${username}/${page}`);
    }

    // Get raid report page count
    getRaidReportPageCount(username: string): Observable<{ pages: number }> {
        return this.http.get<{ pages: number }>(`${environment.apiUrl}/bosses/reports/${username}`);
    }

    // Get unread raid report count
    getUnreadRaidReportCount(username: string): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`${environment.apiUrl}/bosses/reports/unread/${username}`);
    }

    // Mark raid report as read
    markRaidReportAsRead(reportId: string, username: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(`${environment.apiUrl}/bosses/reports/read/${reportId}/${username}`, {});
    }

    getClanClaimInfo(username: string): Observable<{ clanClaims: number; maxClaims: number }> {
        return this.http.get<{ clanClaims: number; maxClaims: number }>(`${environment.apiUrl}/bosses/clan-claims/${username}`);
    }

    // Helper: Get distance multiplier for UI display
    getDistanceMultiplier(distance: number): number {
        return getDistanceDamageMultiplier(distance);
    }

    // Helper: Get distance bonus text for UI display
    getDistanceBonusText(distance: number): string {
        return getDistanceBonusText(distance);
    }

    // Helper: Get minimap color for boss tier
    getMinimapColor(tier: BossTier, isClaimedByMyClan: boolean): string {
        if (isClaimedByMyClan) {
            return CLAIMED_BOSS_COLOR;
        }
        return bossMinimapColors[tier];
    }

    // Helper: Get boss image path
    getBossImagePath(tier: BossTier): string {
        return `assets/${bossImages[tier]}`;
    }

    // Helper: Calculate distance between two points
    calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // Helper: Format HP display
    formatHp(hp: number): string {
        if (hp >= 1000000) {
            return (hp / 1000000).toFixed(1) + 'M';
        } else if (hp >= 1000) {
            return (hp / 1000).toFixed(1) + 'K';
        }
        return hp.toString();
    }

    // Get pending boss rewards
    getPendingRewards(username: string): Observable<{ bossName: string; defeatedAt: Date; rewards: { wood: number; stone: number; crop: number } }[]> {
        return this.http.get<{ bossName: string; defeatedAt: Date; rewards: { wood: number; stone: number; crop: number } }[]>(
            `${environment.apiUrl}/bosses/rewards/pending/${username}`
        );
    }

    // Claim a boss reward
    claimBossReward(username: string, rewardId: string): Observable<{ success: boolean; rewards?: { wood: number; stone: number; crop: number } }> {
        return this.http.post<{ success: boolean; rewards?: { wood: number; stone: number; crop: number } }>(
            `${environment.apiUrl}/bosses/rewards/claim/${username}/${rewardId}`,
            {}
        );
    }
}
