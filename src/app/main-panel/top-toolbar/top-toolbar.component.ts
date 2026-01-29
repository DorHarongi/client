import { Component, OnDestroy, OnInit } from '@angular/core';
import { warehouseStorageByLevel, quartersPopulationByLevel, maxEnergy, energyProductionSpeedPerSecond } from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { LoginService } from 'src/app/login/login.service';
import { ResourcesAmounts } from '../models/resourcesAmounts';
import { Village } from '../models/Village';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-top-toolbar',
  templateUrl: './top-toolbar.component.html',
  styleUrls: ['./top-toolbar.component.scss']
})
export class TopToolbarComponent implements OnInit, OnDestroy {

  resources!: ResourcesAmounts;

  maxWoodStorage: number = 0;
  maxStonesStorage: number = 0;
  maxCropStorage: number = 0;
  maxEnergy: number = 0;
  
  maximumPopulation: number = 0;
  usedPopulation: number = 0;
  math = Math;

  subscription!: Subscription;

  constructor(
    private userInformationService: UserInformationService, 
    private router: Router,
    private loginService: LoginService
  ) { 
    this.updateVillage();
  }
  
  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.userInformationService.villageChanged$.subscribe(()=>{
      this.updateVillage();
    })
  }


  calculateTotalWorkers(village: Village)
  {
    return village.resourcesWorkers.cropWorkers + village.resourcesWorkers.stoneWorkers + village.resourcesWorkers.woodWorkers;
  }

  calculateTotalTroops(village: Village)
  {
    return village.troops.archers + village.troops.axeFighters + village.troops.catapults + village.troops.horsemen + village.troops.magicians + village.troops.spearFighters 
    + village.troops.swordFighters;
  }

  goToStatistics()
  {
    this.router.navigate(['Statistics']);
  }

  goToMessages()
  {
    this.router.navigate(['Inbox']);
  }

  goToHome()
  {
    this.router.navigate(['home']);
  }

  goToMap()
  {
    this.router.navigate(['Map']);
  }

  logout()
  {
    this.loginService.logout();
  }

  updateVillage()
  {
    let village: Village = this.userInformationService.currentVillage;

    this.resources = village.resourcesAmounts

    this.maxWoodStorage = warehouseStorageByLevel[village.buildingsLevels.woodWarehouseLevel];
    this.maxStonesStorage = warehouseStorageByLevel[village.buildingsLevels.stoneWarehouseLevel];
    this.maxCropStorage = warehouseStorageByLevel[village.buildingsLevels.cropWarehouseLevel];
    this.maxEnergy = maxEnergy;

    this.maximumPopulation = quartersPopulationByLevel[village.buildingsLevels.quartersLevel];
    this.usedPopulation = this.calculateTotalTroops(village) + this.calculateTotalWorkers(village);
  }

  getEnergy(): number{
    return this.userInformationService.userInformation.energy;
  }

  getTimeTillNextEnergy(): number{
    let currentEnergy: number = this.getEnergy(); 
    let energyLeftTillNext: number = 1 - currentEnergy % 1;
    let secondsLeft: number = energyLeftTillNext / energyProductionSpeedPerSecond;
    let currentDate: Date = new Date();
    let dateWhenNextEnergy: Date = new Date();
    dateWhenNextEnergy.setSeconds(dateWhenNextEnergy.getSeconds() + secondsLeft);
    return +dateWhenNextEnergy - +currentDate;
  }

}
