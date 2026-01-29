import { BuildingsLevels } from "./buildingsLevels";
import { Location } from "./Location";
import { ResourcesAmounts } from "./resourcesAmounts";
import { ResourcesWorkers } from "./resourcesWorkers";
import { SupportSentEntry } from "./SupportSent";
import { TroopsAmounts } from "./troopsAmounts";
export class Village
{
    villageName!: string;
    resourcesAmounts!: ResourcesAmounts;
    buildingsLevels!: BuildingsLevels;
    population!: number;
    resourcesWorkers!: ResourcesWorkers;
    troops!: TroopsAmounts; 
    clanTroops!: TroopsAmounts;
    location!: Location;
    supportSent!: SupportSentEntry[];
    woodProductionPerSecond!: number;
    stoneProductionPerSecond!: number; 
    cropProductionPerSecond!: number;
}