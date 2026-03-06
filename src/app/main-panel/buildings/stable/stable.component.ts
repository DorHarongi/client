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
  stableLevel: number;
  maxSpies: number = 0;
  currentReduction: number = 0;
  reductionPerLevel: number = 2;
  nextLevelReduction: number = 0;
  nextLevelUnlocksSpy: boolean = false;
  nextLevelSpies: number = 0;
  isMaxLevel: boolean = false;

  constructor(private userInformationService: UserInformationService) {
    this.stableLevel = this.userInformationService.currentVillage.buildingsLevels.stableLevel;
    const maxLevel = stableDetectionReductionByLevel.length - 1;
    this.isMaxLevel = this.stableLevel >= maxLevel;

    this.buildingInformation = new Building(
      'stable',
      'Stable',
      this.stableLevel,
      `The Stable trains and houses your spies. Higher levels reduce enemy spy detection chance and unlock more spy capacity. Spy movement speed: ${SPY_SPEED} tiles/min.`,
      stableUpgradeMaterialCostByLevels[this.stableLevel + 1]
    );

    this.maxSpies = getMaxSpies(this.stableLevel);
    this.currentReduction = stableDetectionReductionByLevel[this.stableLevel] ?? 0;

    if (!this.isMaxLevel) {
      this.nextLevelReduction = stableDetectionReductionByLevel[this.stableLevel + 1] ?? 0;
      const currentSpies = stableMaxSpiesByLevel[this.stableLevel] ?? 0;
      this.nextLevelSpies = stableMaxSpiesByLevel[this.stableLevel + 1] ?? 0;
      this.nextLevelUnlocksSpy = this.nextLevelSpies > currentSpies;
    }
  }

  ngOnInit(): void {
  }
}
