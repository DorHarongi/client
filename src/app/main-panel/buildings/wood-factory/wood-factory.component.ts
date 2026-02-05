import { Component, OnDestroy, OnInit } from '@angular/core';
import { woodFactoryUpgradeMaterialCostByLevels, factoriesProductionSpeedByLevel, singleWorkerProductionSpeedPerSecond, VillageTrait, getTraitBonus } from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
import { ResourcesWorkers } from '../../models/resourcesWorkers';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { QuestAwareResponse } from 'src/app/quests/quest-response.model';
import { QuestService } from 'src/app/quests/quest.service';

@Component({
  selector: 'app-wood-factory',
  templateUrl: './wood-factory.component.html',
  styleUrls: ['./wood-factory.component.scss']
})
export class WoodFactoryComponent implements OnInit, OnDestroy {

  buildingInformation: Building;
  currentProductionPerHour: number;
  nextLevelProductionPerHour: number;
  singleWorkerProductionPerHour: number;
  woodWorkers: number;
  subscription!: Subscription;

  constructor(
    private userInformationService: UserInformationService, 
    private http: HttpClient, 
    private router: Router,
    private questService: QuestService
  ) {
    const village = this.userInformationService.currentVillage;
    
    // Calculate Vanguard multiplier if applicable
    let vanguardMultiplier = 1;
    if (village.trait === VillageTrait.VANGUARD) {
      const academyLevel = village.buildingsLevels.academyLevel || 1;
      vanguardMultiplier = 1 + getTraitBonus(academyLevel);
    }
     
    this.buildingInformation = new Building("woodFactory", "Wood Factory", village.buildingsLevels.woodFactoryLevel, 
    "The wood factory produces the wood of your village. The higher its level and the more wood workers you employ there, the faster the production is.",
    woodFactoryUpgradeMaterialCostByLevels[village.buildingsLevels.woodFactoryLevel + 1]);

    this.currentProductionPerHour = factoriesProductionSpeedByLevel[village.buildingsLevels.woodFactoryLevel] * 3600 * vanguardMultiplier;
    this.nextLevelProductionPerHour = factoriesProductionSpeedByLevel[village.buildingsLevels.woodFactoryLevel + 1] * 3600 * vanguardMultiplier;
    this.singleWorkerProductionPerHour = singleWorkerProductionSpeedPerSecond * 3600 * vanguardMultiplier;

    this.woodWorkers = village.resourcesWorkers.woodWorkers;
  }
  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  ngOnInit(): void {
  }

  updateWorkers(workers: number)
  {
    this.woodWorkers = workers;
  }

  hireWorkers()
  {
    let village = this.userInformationService.currentVillage;
    let resourcesWorkers: ResourcesWorkers = new ResourcesWorkers(this.woodWorkers - village.resourcesWorkers.woodWorkers, 0, 0);
    let observable: Observable<QuestAwareResponse>  = this.http.post<QuestAwareResponse>(`${environment.apiUrl}/workers`,
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
    });
  }
}
