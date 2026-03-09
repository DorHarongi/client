import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DailyQuestWithProgress {
  quest: {
    id: string;
    title: string;
    description: string;
    target: number;
    reward: { wood: number; stone: number; crop: number };
  };
  progress: number;
  claimed: boolean;
}

export interface TodayQuestsResponse {
  quests: DailyQuestWithProgress[];
  isAvailable: boolean;
}

export interface ClaimDailyQuestResponse {
  user: any | null;
}

@Injectable({
  providedIn: 'root'
})
export class DailyQuestService {
  constructor(private http: HttpClient) {}

  getTodaysQuests(): Observable<TodayQuestsResponse> {
    return this.http.get<TodayQuestsResponse>(`${environment.apiUrl}/daily-quests/today`);
  }

  claimDailyQuest(questId: string, villageIndex: number): Observable<ClaimDailyQuestResponse> {
    return this.http.post<ClaimDailyQuestResponse>(`${environment.apiUrl}/daily-quests/claim`, {
      questId,
      villageIndex
    });
  }
}
