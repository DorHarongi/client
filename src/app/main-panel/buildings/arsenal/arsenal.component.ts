import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { arsenalUpgradeMaterialCostByLevels, troopUnlockByLevel, MaterialsCost, quartersPopulationByLevel,
         swordFighterMaterialsCost, spearFighterMaterialsCost, axeFighterMaterialsCost, archerMaterialsCost, magicianMaterialsCost, horsemenMaterialsCost, catapultsMaterialsCost}
        from 'utils'
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
import { TroopsAmounts } from '../../models/troopsAmounts';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Village } from '../../models/Village';
import { ResourcesAmounts } from '../../models/resourcesAmounts';
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { QuestAwareResponse } from 'src/app/quests/quest-response.model';
import { QuestService } from 'src/app/quests/quest.service';

@Component({
  selector: 'app-arsenal',
  templateUrl: './arsenal.component.html',
  styleUrls: ['./arsenal.component.scss']
})
export class ArsenalComponent implements OnInit, OnDestroy {

  buildingInformation: Building;
  nextLevelUnlock: string;
  totalMaterialsCost: MaterialsCost = {wood: 0, stones: 0, crop: 0};
  troops: TroopsAmounts = new TroopsAmounts(0, 0, 0, 0, 0, 0, 0);
  maxPossibleTroops: TroopsAmounts;
  subscription!: Subscription;

  constructor(
    private userInformationService: UserInformationService, 
    private http: HttpClient, 
    private router: Router, 
    private changerDector: ChangeDetectorRef,
    private questService: QuestService
  ) { 

    this.buildingInformation = new Building("arsenal", "Arsenal", this.userInformationService.currentVillage.buildingsLevels.arsenalLevel,
    "In the arsenal you can train your army troops. Level up your arsenal to unlock new troops",
    arsenalUpgradeMaterialCostByLevels[this.userInformationService.currentVillage.buildingsLevels.arsenalLevel + 1]);
    this.nextLevelUnlock = troopUnlockByLevel[this.userInformationService.currentVillage.buildingsLevels.arsenalLevel + 1];
    this.maxPossibleTroops = this.calculateMaxTroopsAmounts();
  }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  ngOnInit(): void {
  }

  updateMaterialsCost()
  {
    this.totalMaterialsCost.wood =
     spearFighterMaterialsCost.wood * this.troops.spearFighters +
     swordFighterMaterialsCost.wood * this.troops.swordFighters +
     axeFighterMaterialsCost.wood * this.troops.axeFighters +
     archerMaterialsCost.wood * this.troops.archers +
     magicianMaterialsCost.wood * this.troops.magicians +
     horsemenMaterialsCost.wood * this.troops.horsemen +
     catapultsMaterialsCost.wood * this.troops.catapults;

     this.totalMaterialsCost.stones =
     spearFighterMaterialsCost.stones * this.troops.spearFighters +
     swordFighterMaterialsCost.stones * this.troops.swordFighters +
     axeFighterMaterialsCost.stones * this.troops.axeFighters +
     archerMaterialsCost.stones * this.troops.archers +
     magicianMaterialsCost.stones * this.troops.magicians +
     horsemenMaterialsCost.stones * this.troops.horsemen +
     catapultsMaterialsCost.stones * this.troops.catapults;

     this.totalMaterialsCost.crop =
     spearFighterMaterialsCost.crop * this.troops.spearFighters +
     swordFighterMaterialsCost.crop * this.troops.swordFighters +
     axeFighterMaterialsCost.crop * this.troops.axeFighters +
     archerMaterialsCost.crop * this.troops.archers +
     magicianMaterialsCost.crop * this.troops.magicians +
     horsemenMaterialsCost.crop * this.troops.horsemen +
     catapultsMaterialsCost.crop * this.troops.catapults;
  }

  checkIfEnoughWoodToTrain(): boolean
  {
    return this.userInformationService.currentVillage.resourcesAmounts.woodAmount >= this.totalMaterialsCost.wood;
  }

  checkIfEnoughCropToTrain(): boolean
  {
    return this.userInformationService.currentVillage.resourcesAmounts.cropAmount >= this.totalMaterialsCost.crop;
  }

  checkIfEnoughStonesToTrain(): boolean
  {
    return this.userInformationService.currentVillage.resourcesAmounts.stonesAmount >= this.totalMaterialsCost.stones;
  }

  checkIfEnoughMaterialsToTrain(): boolean
  {
    return this.checkIfEnoughWoodToTrain() && this.checkIfEnoughCropToTrain() && this.checkIfEnoughStonesToTrain();
  }

  updateTroops(troopsAmounts: TroopsAmounts){
    this.troops = troopsAmounts;
    this.updateMaterialsCost();
    this.maxPossibleTroops = this.calculateMaxTroopsAmounts();
  }

  checkFreePopulation(): number
  {
    let village: Village = this.userInformationService.currentVillage;
    let maximumPopulation: number = quartersPopulationByLevel[village.buildingsLevels.quartersLevel];
    let usedPopulation: number = this.calculateTotalTroops(village) + this.calculateTotalWorkers(village);
    let freePopulation = maximumPopulation - usedPopulation;
    return freePopulation;
  }

  calculateTotalWorkers(village: Village): number
  {
    return village.resourcesWorkers.cropWorkers + village.resourcesWorkers.stoneWorkers + village.resourcesWorkers.woodWorkers;
  }

  calculateTotalTroops(village: Village): number
  {
    return village.troops.archers + village.troops.axeFighters + village.troops.catapults + village.troops.horsemen + village.troops.magicians + village.troops.spearFighters 
    + village.troops.swordFighters + 
    this.troops.archers + this.troops.axeFighters + this.troops.catapults + this.troops.horsemen + this.troops.magicians + this.troops.spearFighters + this.troops.swordFighters;
  }

  calculateMaxPossibleTroopsByTrainingCost(materialCost: MaterialsCost): number
  {
    let villageResourcesAmounts = this.userInformationService.currentVillage.resourcesAmounts;
    // copy so we dont change the original
    let avaliableResources: ResourcesAmounts = new ResourcesAmounts(villageResourcesAmounts.woodAmount, villageResourcesAmounts.stonesAmount, villageResourcesAmounts.cropAmount);
    avaliableResources.cropAmount -= this.totalMaterialsCost.crop;
    avaliableResources.stonesAmount -= this.totalMaterialsCost.stones;
    avaliableResources.woodAmount -= this.totalMaterialsCost.wood;

    let woodTimes: number = Math.floor(avaliableResources.woodAmount / materialCost.wood);
    let StonesTimes: number = Math.floor(avaliableResources.stonesAmount / materialCost.stones);
    let cropTimes: number = Math.floor(avaliableResources.cropAmount / materialCost.crop);
    return Math.min(woodTimes, StonesTimes, cropTimes);
  }

  calculateMaxTroopsAmounts(): TroopsAmounts
  {
    let freePopulation: number = this.checkFreePopulation();
    let maxSpearFighters: number = Math.min(freePopulation, this.calculateMaxPossibleTroopsByTrainingCost(spearFighterMaterialsCost));
    let maxSwordFighters: number = Math.min(freePopulation, this.calculateMaxPossibleTroopsByTrainingCost(swordFighterMaterialsCost));
    let maxAxeFighters: number = Math.min(freePopulation, this.calculateMaxPossibleTroopsByTrainingCost(axeFighterMaterialsCost));
    let maxArchers: number = Math.min(freePopulation, this.calculateMaxPossibleTroopsByTrainingCost(archerMaterialsCost));
    let maxMagicians: number = Math.min(freePopulation, this.calculateMaxPossibleTroopsByTrainingCost(magicianMaterialsCost));
    let maxHorsemen: number = Math.min(freePopulation, this.calculateMaxPossibleTroopsByTrainingCost(horsemenMaterialsCost));
    let maxCatapults: number = Math.min(freePopulation, this.calculateMaxPossibleTroopsByTrainingCost(catapultsMaterialsCost));
    return new TroopsAmounts(maxSpearFighters, maxSwordFighters, maxAxeFighters, maxArchers, maxMagicians, maxHorsemen, maxCatapults);
  }

  trainTroops()
  {
    if(this.checkIfEnoughMaterialsToTrain())
    {
      let observable: Observable<QuestAwareResponse> = this.http.post<QuestAwareResponse>(`${environment.apiUrl}/troops-training`,
      {
        username: this.userInformationService.userInformation.username,
        villageIndex: this.userInformationService.currentVillageIndex,
        troopsAmount: this.troops
      });
      this.subscription = observable.subscribe((response: QuestAwareResponse)=>{
        this.userInformationService.setUserInformation(response.user);
        
        // Check for quest completion
        if (response.questCompleted) {
          this.questService.notifyQuestCompleted(response.questCompleted);
        }
        
        this.router.navigateByUrl('home');
      })
    }
  }

}
