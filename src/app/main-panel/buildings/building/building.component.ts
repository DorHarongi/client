import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
import { User } from '../../models/User';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-building',
  templateUrl: './building.component.html',
  styleUrls: ['./building.component.scss'],
})
export class BuildingComponent implements OnInit, OnDestroy {

  constructor(private router: Router, private userInformationService: UserInformationService, private http:HttpClient) { }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  @Input()
  building!: Building;
  subscription!: Subscription;
  

  ngOnInit(): void {
  }

  goBack()
  {
    this.router.navigateByUrl('home');
  }

  upgrade(): void{
    if(this.checkIfEnoughMaterialsToUpgrade())
    {
      let observable: Observable<User> = this.http.post<User>(`${environment.apiUrl}/buildings-upgrading/upgradeBuilding`,
      {
        username: this.userInformationService.userInformation.username,
        villageIndex: this.userInformationService.currentVillageIndex,
        buildingName: this.building.name
      });
      this.subscription = observable.subscribe((user: User)=>{
        this.userInformationService.setUserInformation(user);
        this.router.navigateByUrl('home');
      })
    }
  }

  checkIfCenterBuildingLevelHighEnough()
  {
    // if we upgrade the center building there is no need to check its level, otherwise we need to check that the building level is smaller than it.
    return this.building.name == "centerBuilding" || this.building.level < this.userInformationService.currentVillage.buildingsLevels.centerBuildingLevel;
  }

  checkIfEnoughWoodToUpgrade(): boolean
  {
    return this.userInformationService.currentVillage.resourcesAmounts.woodAmount >= this.building.levelUpMaterialCost.wood;
  }

  checkIfEnoughCropToUpgrade(): boolean
  {
    return this.userInformationService.currentVillage.resourcesAmounts.cropAmount >= this.building.levelUpMaterialCost.crop;
  }

  checkIfEnoughStonesToUpgrade(): boolean
  {
    return this.userInformationService.currentVillage.resourcesAmounts.stonesAmount >= this.building.levelUpMaterialCost.stones;
  }

  checkIfEnoughMaterialsToUpgrade(): boolean
  {
    return this.checkIfEnoughWoodToUpgrade() && this.checkIfEnoughCropToUpgrade() && this.checkIfEnoughStonesToUpgrade();
  }

}
