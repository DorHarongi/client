import { Component, OnDestroy, OnInit } from '@angular/core';
import { cropFarmUpgradeMaterialCostByLevels, factoriesProductionSpeedByLevel, singleWorkerProductionSpeedPerSecond, getSkillBonus, SkillCategory } from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
import { Village } from '../../models/Village';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ResourcesWorkers } from '../../models/resourcesWorkers';
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { QuestAwareResponse } from 'src/app/quests/quest-response.model';
import { QuestService } from 'src/app/quests/quest.service';

@Component({
  selector: 'app-crop-farm',
  templateUrl: './crop-farm.component.html',
  styleUrls: ['./crop-farm.component.scss']
})
export class CropFarmComponent implements OnInit, OnDestroy {

  buildingInformation: Building;
  currentProductionPerHour: number;
  nextLevelProductionPerHour: number;
  singleWorkerProductionPerHour: number;
  cropWorkers: number;
  subscription!: Subscription;

  constructor(
    private userInformationService: UserInformationService, 
    private http: HttpClient, 
    private router: Router,
    private questService: QuestService
  ) {
    const village = this.userInformationService.currentVillage;

    // Calculate Gold Rush multiplier from skills
    const goldRushBonus = getSkillBonus(village.skills, SkillCategory.GOLD_RUSH);
    const productionMultiplier = 1 + goldRushBonus;

    this.buildingInformation = new Building("cropFarm", "Crop Farm", village.buildingsLevels.cropFarmLevel, 
    "The crop farm produces the crop of your village. The higher its level and the more crop workers you employ there, the faster the production is.",
    cropFarmUpgradeMaterialCostByLevels[village.buildingsLevels.cropFarmLevel + 1]);

    this.currentProductionPerHour = Math.round(factoriesProductionSpeedByLevel[village.buildingsLevels.cropFarmLevel] * 3600 * productionMultiplier);
    this.nextLevelProductionPerHour = Math.round(factoriesProductionSpeedByLevel[village.buildingsLevels.cropFarmLevel + 1] * 3600 * productionMultiplier);
    this.singleWorkerProductionPerHour = Math.round(singleWorkerProductionSpeedPerSecond * 3600 * productionMultiplier);

    this.cropWorkers = this.userInformationService.currentVillage.resourcesWorkers.cropWorkers;
  }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  ngOnInit(): void {
  }

  updateWorkers(workers: number)
  {
    this.cropWorkers = workers;
  }

  getOriginalFreePopulation(): number {
    return Village.getFreePopulation(this.userInformationService.currentVillage);
  }

  getFreePopulation(): number {
    const village = this.userInformationService.currentVillage;
    const pendingDelta = this.cropWorkers - village.resourcesWorkers.cropWorkers;
    return Village.getFreePopulation(village) - pendingDelta;
  }

  hireWorkers()
  {
    let village = this.userInformationService.currentVillage;
    let resourcesWorkers: ResourcesWorkers = new ResourcesWorkers(0, 0, this.cropWorkers - village.resourcesWorkers.cropWorkers);
    let observable: Observable<QuestAwareResponse> = this.http.post<QuestAwareResponse>(`${environment.apiUrl}/workers`,
    {
      username: this.userInformationService.userInformation.username,
      villageIndex: this.userInformationService.currentVillageIndex,
      resourcesWorkers: resourcesWorkers
    });
    this.subscription = observable.subscribe((response: QuestAwareResponse)=>{
      this.userInformationService.setUserInformation(response.user);
      
      // Notify quest service if quest is now claimable
      if (response.isQuestClaimable) {
        this.questService.notifyQuestClaimable();
      }
      
      this.router.navigateByUrl('home');
    })
  }

}
