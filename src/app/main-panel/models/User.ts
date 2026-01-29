import { Village } from "./Village";

export class User
{
    username!: string;
    joinDate!: Date;
    clanName!: string;
    villages!: Village[];
    energy!: number;
    pendingClanRequests!: string[];
}