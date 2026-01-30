import { Component, OnDestroy, OnInit } from '@angular/core';
import { stoneMineUpgradeMaterialCostByLevels, factoriesProductionSpeedByLevel, singleWorkerProductionSpeedPerSecond} from 'utils';
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
  selector: 'app-stone-mine',
  templateUrl: './stone-mine.component.html',
  styleUrls: ['./stone-mine.component.scss']
})
export class StoneMineComponent implements OnInit, OnDestroy {

  buildingInformation: Building;
  currentProductionPerHour: number;
  nextLevelProductionPerHour: number;
  singleWorkerProductionPerHour: number;
  stoneWorkers: number;
  subscription!: Subscription;

  constructor(
    private userInformationService: UserInformationService, 
    private http: HttpClient, 
    private router: Router,
    private questService: QuestService
  ) {
    
    this.buildingInformation = new Building("stoneMine", "Stone Mine", this.userInformationService.currentVillage.buildingsLevels.stoneMineLevel, 
    "The stone mine produces the stones of your village. The higher its level and the more wood workers you employ there, the faster the production is.",
    stoneMineUpgradeMaterialCostByLevels[this.userInformationService.currentVillage.buildingsLevels.stoneMineLevel + 1]);

    this.currentProductionPerHour = factoriesProductionSpeedByLevel[this.userInformationService.currentVillage.buildingsLevels.stoneMineLevel] * 3600;
    this.nextLevelProductionPerHour = factoriesProductionSpeedByLevel[this.userInformationService.currentVillage.buildingsLevels.stoneMineLevel + 1] * 3600;
    this.singleWorkerProductionPerHour = singleWorkerProductionSpeedPerSecond * 3600;

    this.stoneWorkers = this.userInformationService.currentVillage.resourcesWorkers.stoneWorkers;
  }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  ngOnInit(): void {
  }

  updateWorkers(workers: number)
  {
    this.stoneWorkers = workers;
  }

  hireWorkers()
  {
    let village = this.userInformationService.currentVillage;
    let resourcesWorkers: ResourcesWorkers = new ResourcesWorkers(0,this.stoneWorkers - village.resourcesWorkers.stoneWorkers, 0);
    let observable: Observable<QuestAwareResponse> = this.http.post<QuestAwareResponse>(`${environment.apiUrl}/workers`,
    {
      username: this.userInformationService.userInformation.username,
      villageIndex: this.userInformationService.currentVillageIndex,
      resourcesWorkers: resourcesWorkers
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
