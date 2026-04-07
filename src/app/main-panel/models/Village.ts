import { Skills, quartersPopulationByLevel } from 'utils';
import { BuildingsLevels } from './buildingsLevels';
import { Location } from './Location';
import { ResourcesAmounts } from './resourcesAmounts';
import { ResourcesWorkers } from './resourcesWorkers';
import { OasisTroopsSentEntry, SupportSentEntry } from './SupportSent';
import { TroopsAmounts } from './troopsAmounts';

export class Village {
  villageName!: string;
  resourcesAmounts!: ResourcesAmounts;
  buildingsLevels!: BuildingsLevels;
  population!: number;
  resourcesWorkers!: ResourcesWorkers;
  troops!: TroopsAmounts;
  clanTroops!: TroopsAmounts;
  location!: Location;
  supportSent!: SupportSentEntry[];
  oasisTroopsSent!: OasisTroopsSentEntry[];
  woodProductionPerSecond!: number;
  stoneProductionPerSecond!: number;
  cropProductionPerSecond!: number;
  skills!: Skills;
  troopsInTransit!: number;
  aliveSpies!: number;
  spyDeathTimestamps!: Date[];
  heldRelicIds!: string[];

  static getTotalTroops(village: Village): number {
    const t = village.troops;
    return (
      t.spearFighters +
      t.swordFighters +
      t.axeFighters +
      t.archers +
      t.magicians +
      t.horsemen +
      t.catapults
    );
  }

  static getTotalWorkers(village: Village): number {
    const w = village.resourcesWorkers;
    return w.cropWorkers + w.stoneWorkers + w.woodWorkers;
  }

  static getTotalSupportSent(village: Village): number {
    if (!village.supportSent || village.supportSent.length === 0) return 0;
    let total = 0;
    for (const entry of village.supportSent) {
      const t = entry.troops;
      total +=
        (t.spearFighters || 0) +
        (t.swordFighters || 0) +
        (t.axeFighters || 0) +
        (t.archers || 0) +
        (t.magicians || 0) +
        (t.horsemen || 0) +
        (t.catapults || 0);
    }
    return total;
  }

  static getTotalOasisTroops(village: Village): number {
    if (!village.oasisTroopsSent || village.oasisTroopsSent.length === 0) return 0;
    let total = 0;
    for (const entry of village.oasisTroopsSent) {
      const t = entry.troops;
      total +=
        (t.spearFighters || 0) +
        (t.swordFighters || 0) +
        (t.axeFighters || 0) +
        (t.archers || 0) +
        (t.magicians || 0) +
        (t.horsemen || 0) +
        (t.catapults || 0);
    }
    return total;
  }

  static getUsedPopulation(village: Village): number {
    return (
      Village.getTotalTroops(village) +
      Village.getTotalWorkers(village) +
      Village.getTotalSupportSent(village) +
      Village.getTotalOasisTroops(village) +
      (village.troopsInTransit || 0)
    );
  }

  static getFreePopulation(village: Village): number {
    const max =
      quartersPopulationByLevel[village.buildingsLevels.quartersLevel];
    return max - Village.getUsedPopulation(village);
  }
}
