import { User } from '../main-panel/models/User';
import { QuestCompletionResult } from 'utils';

/**
 * Response from API endpoints that may affect quest status
 * Rewards are never auto-claimed - user must manually claim them
 */
export interface QuestAwareResponse {
    user: User;
    isQuestClaimable?: boolean;
    // Only set after manual claim via /quests/claim endpoint
    questCompleted?: QuestCompletionResult | null;
}
