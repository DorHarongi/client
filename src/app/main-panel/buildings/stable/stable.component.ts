import { Component, OnInit } from '@angular/core';
import {
  stableUpgradeMaterialCostByLevels, getMaxSpies, SPY_SPEED,
  stableDetectionReductionByLevel, stableMaxSpiesByLevel
} from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';

@Component({
  selector: 'app-stable',
  templateUrl: './stable.component.html',
  styleUrls: ['./stable.component.scss']
})
export class StableComponent implements OnInit {

  buildingInformation: Building;
  maxSpies: number = 0;
  currentReduction: number = 0;
  nextLevelInfo: string = '';

  constructor(private userInformationService: UserInformationService) {
    const level = this.userInformationService.currentVillage.buildingsLevels.stableLevel;
    this.buildingInformation = new Building(
      'stable',
      'Stable',
      level,
      `The Stable trains and houses your spies. Higher levels reduce scout detection chance and unlock more spy capacity. Spy movement speed: ${SPY_SPEED} tiles/min.`,
      stableUpgradeMaterialCostByLevels[level + 1]
    );
    this.maxSpies = getMaxSpies(level);
    this.currentReduction = stableDetectionReductionByLevel[level] ?? 0;
    this.nextLevelInfo = this.buildNextLevelInfo(level);
  }

  ngOnInit(): void {
  }

  private buildNextLevelInfo(level: number): string {
    const maxLevel = stableDetectionReductionByLevel.length - 1;
    if (level >= maxLevel) return '';

    const parts: string[] = [];
    const nextSpies = stableMaxSpiesByLevel[level + 1] ?? 0;
    const currentSpies = stableMaxSpiesByLevel[level] ?? 0;
    if (nextSpies > currentSpies) {
      parts.push('unlocks another spy');
    }
    const nextReduction = stableDetectionReductionByLevel[level + 1] ?? 0;
    if (nextReduction > 0) {
      parts.push(`${nextReduction}% detection reduction`);
    }
    return parts.length > 0 ? `Next level: ${parts.join(', ')}.` : '';
  }
}
