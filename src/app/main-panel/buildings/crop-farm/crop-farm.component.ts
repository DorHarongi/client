import { Component, OnDestroy, OnInit } from '@angular/core';
import { cropFarmUpgradeMaterialCostByLevels, factoriesProductionSpeedByLevel, singleWorkerProductionSpeedPerSecond} from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
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

    this.buildingInformation = new Building("cropFarm", "Crop Farm", this.userInformationService.currentVillage.buildingsLevels.cropFarmLevel, 
    "The crop farm produces the crop of your village. The higher its level and the more crop workers you employ there, the faster the production is.",
    cropFarmUpgradeMaterialCostByLevels[this.userInformationService.currentVillage.buildingsLevels.cropFarmLevel + 1]);

    this.currentProductionPerHour = factoriesProductionSpeedByLevel[this.userInformationService.currentVillage.buildingsLevels.cropFarmLevel] * 3600;
    this.nextLevelProductionPerHour = factoriesProductionSpeedByLevel[this.userInformationService.currentVillage.buildingsLevels.cropFarmLevel + 1] * 3600;
    this.singleWorkerProductionPerHour = singleWorkerProductionSpeedPerSecond * 3600;

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
      
      // Check for quest completion
      if (response.questCompleted) {
        this.questService.notifyQuestCompleted(response.questCompleted);
      }
      
      this.router.navigateByUrl('home');
    })
  }

}
