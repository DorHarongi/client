import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ClanQuestDefinition {
  id: string;
  title: string;
  description: string;
  trackingType: string;
  target: number;
  reward: { wood: number; stone: number; crop: number };
}

export interface ClanQuestProgressDoc {
  clanName: string;
  weekSeed: number;
  questId: string;
  progress: number;
  completedAt?: string;
  contributions: { username: string; amount: number }[];
}

export interface ClanQuestStatusResponse {
  quest: ClanQuestDefinition;
  clanProgress: ClanQuestProgressDoc | null;
  canClaim: boolean;
  alreadyClaimed: boolean;
  clanCompleted: boolean;
}

export interface ClaimClanQuestResponse {
  user: any | null;
}

@Injectable({
  providedIn: 'root'
})
export class ClanQuestService {
  constructor(private http: HttpClient) {}

  getClanQuestStatus(): Observable<ClanQuestStatusResponse | null> {
    return this.http.get<ClanQuestStatusResponse | null>(`${environment.apiUrl}/clan-quests/status`);
  }

  claimClanQuestReward(villageIndex: number): Observable<ClaimClanQuestResponse> {
    return this.http.post<ClaimClanQuestResponse>(`${environment.apiUrl}/clan-quests/claim`, {
      villageIndex
    });
  }
}
