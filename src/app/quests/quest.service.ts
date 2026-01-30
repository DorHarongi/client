import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Quest, QuestCompletionResult, QUESTS, getQuestByIndex, TOTAL_QUESTS } from 'utils';
import { environment } from 'src/environments/environment';
import { QuestAwareResponse } from './quest-response.model';

interface QuestStatusResponse {
  isClaimable: boolean;
  user: any;
}

@Injectable({
  providedIn: 'root'
})
export class QuestService {
  // Event emitter for quest completion
  private questCompleted$ = new Subject<QuestCompletionResult>();
  onQuestCompleted$ = this.questCompleted$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get the current quest for a user
   */
  getCurrentQuest(currentQuestIndex: number): Quest | null {
    if (currentQuestIndex < 1 || currentQuestIndex > TOTAL_QUESTS) {
      return null;
    }
    return getQuestByIndex(currentQuestIndex) || null;
  }

  /**
   * Check if user has completed all quests
   */
  hasCompletedAllQuests(currentQuestIndex: number): boolean {
    return currentQuestIndex > TOTAL_QUESTS;
  }

  /**
   * Check if quests are available (only for first village)
   */
  areQuestsAvailable(currentQuestIndex: number, villageCount: number): boolean {
    // Quests only show for users on their first village and who haven't completed all quests
    return villageCount === 1 && currentQuestIndex >= 1 && currentQuestIndex <= TOTAL_QUESTS;
  }

  /**
   * Emit quest completion event
   */
  notifyQuestCompleted(result: QuestCompletionResult): void {
    this.questCompleted$.next(result);
  }

  /**
   * Get all quests
   */
  getAllQuests(): Quest[] {
    return QUESTS;
  }

  /**
   * Get total quest count
   */
  getTotalQuests(): number {
    return TOTAL_QUESTS;
  }

  /**
   * Check if current quest is claimable (conditions already met)
   */
  checkQuestStatus(username: string): Observable<QuestStatusResponse> {
    return this.http.post<QuestStatusResponse>(`${environment.apiUrl}/quests/status`, { username });
  }

  /**
   * Claim rewards for a quest that's already completed
   */
  claimQuest(username: string): Observable<QuestAwareResponse> {
    return this.http.post<QuestAwareResponse>(`${environment.apiUrl}/quests/claim`, { username });
  }
}
