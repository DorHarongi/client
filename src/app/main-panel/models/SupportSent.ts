import { TroopsAmounts } from "./troopsAmounts";

export interface SupportSentEntry {
    recipientUsername: string;
    recipientVillageName: string;
    troops: TroopsAmounts;
}
