import { Component, OnInit } from '@angular/core';
import { wallUpgradeMaterialCostByLevels, wallDefenseByLevel, WALL_DETECTION_PER_LEVEL } from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';

@Component({
  selector: 'app-wall',
  templateUrl: './wall.component.html',
  styleUrls: ['./wall.component.scss']
})
export class WallComponent implements OnInit {

  buildingInformation: Building;
  currentDefence: number;
  nextLevelDefence: number;
  wallLevel: number;
  currentDetectionBonus: number;
  nextLevelDetectionBonus: number;
  detectionPerLevel = WALL_DETECTION_PER_LEVEL;

  constructor(private userInformationService: UserInformationService) { 
    this.wallLevel = this.userInformationService.currentVillage.buildingsLevels.wallLevel;

    this.buildingInformation = new Building("wall", "Wall", this.wallLevel, 
    "The wall is your village's first layer of defense. Higher levels increase defense and improve spy detection chance.",
    wallUpgradeMaterialCostByLevels[this.wallLevel + 1]);

    this.currentDefence = wallDefenseByLevel[this.wallLevel];
    this.nextLevelDefence = wallDefenseByLevel[this.wallLevel + 1];
    this.currentDetectionBonus = this.wallLevel * WALL_DETECTION_PER_LEVEL;
    this.nextLevelDetectionBonus = (this.wallLevel + 1) * WALL_DETECTION_PER_LEVEL;
  }

  ngOnInit(): void {
  }

}
