import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Village } from '../models/Village';
import { TroopsAmounts } from '../models/troopsAmounts';

@Component({
  selector: 'app-right-toolbar',
  templateUrl: './right-toolbar.component.html',
  styleUrls: ['./right-toolbar.component.scss']
})
export class RightToolbarComponent implements OnInit, OnDestroy {

  constructor(private userInformationService: UserInformationService) { 

  }
  cropProduction!: number;
  woodProduction!: number;
  stoneProduction!: number;

  spearFighters!: number;
  swordFighters!: number;
  axeFighters!: number;
  archers!: number;
  magicians!: number;
  horsemen!: number;
  catapults !: number;

  // Clan support troops
  clanSpearFighters!: number;
  clanSwordFighters!: number;
  clanAxeFighters!: number;
  clanArchers!: number;
  clanMagicians!: number;
  clanHorsemen!: number;
  clanCatapults!: number;
  hasClanTroops: boolean = false;

  villages: Array<string> = [];
  activeVillage: number = 0;

  subscription!: Subscription;


  ngOnInit(): void {

    this.updateVillage();

    this.villages = this.userInformationService.userInformation.villages.map((village: Village)=>{
      return village.villageName;
    });

    this.subscription = this.userInformationService.villageChanged$.subscribe(()=>{
      this.updateVillage();
      this.villages = this.userInformationService.userInformation.villages.map((village: Village)=>{
        return village.villageName;
      });
    })

  }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  updateVillage()
  {
    this.activeVillage = this.userInformationService.currentVillageIndex;

    this.cropProduction = this.userInformationService.currentVillage.cropProductionPerSecond * 3600;
    this.woodProduction = this.userInformationService.currentVillage.woodProductionPerSecond * 3600;
    this.stoneProduction =this.userInformationService.currentVillage.stoneProductionPerSecond * 3600;

    this.spearFighters = this.userInformationService.currentVillage.troops.spearFighters;
    this.swordFighters = this.userInformationService.currentVillage.troops.swordFighters;
    this.axeFighters = this.userInformationService.currentVillage.troops.axeFighters;
    this.archers = this.userInformationService.currentVillage.troops.archers;
    this.magicians = this.userInformationService.currentVillage.troops.magicians;
    this.horsemen = this.userInformationService.currentVillage.troops.horsemen;
    this.catapults = this.userInformationService.currentVillage.troops.catapults;

    // Update clan support troops
    const clanTroops = this.userInformationService.currentVillage.clanTroops;
    if (clanTroops) {
      this.clanSpearFighters = clanTroops.spearFighters || 0;
      this.clanSwordFighters = clanTroops.swordFighters || 0;
      this.clanAxeFighters = clanTroops.axeFighters || 0;
      this.clanArchers = clanTroops.archers || 0;
      this.clanMagicians = clanTroops.magicians || 0;
      this.clanHorsemen = clanTroops.horsemen || 0;
      this.clanCatapults = clanTroops.catapults || 0;
      
      this.hasClanTroops = this.clanSpearFighters > 0 || this.clanSwordFighters > 0 || 
        this.clanAxeFighters > 0 || this.clanArchers > 0 || this.clanMagicians > 0 || 
        this.clanHorsemen > 0 || this.clanCatapults > 0;
    } else {
      this.hasClanTroops = false;
    }
  }

  switchToVillage(index: number) // clicked on a differnet village
  {
    this.userInformationService.switchVillage(index);
  }
}
