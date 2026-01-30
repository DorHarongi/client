import { User } from '../main-panel/models/User';
import { QuestCompletionResult } from 'utils';

/**
 * Response from API endpoints that may trigger quest completion
 */
export interface QuestAwareResponse {
    user: User;
    questCompleted?: QuestCompletionResult | null;
}
