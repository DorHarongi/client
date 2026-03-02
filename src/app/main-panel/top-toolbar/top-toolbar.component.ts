import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { warehouseStorageByLevel, quartersPopulationByLevel, maxEnergy, energyProductionSpeedPerSecond } from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { LoginService } from 'src/app/login/login.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ResourcesAmounts } from '../models/resourcesAmounts';
import { Village } from '../models/Village';
import { Router } from '@angular/router';
import { Subscription, forkJoin, timer } from 'rxjs';
import { environment } from 'src/environments/environment';

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

  unreadCount: number = 0;

  subscription!: Subscription;
  unreadSubscription?: Subscription;
  notificationSubscription?: Subscription;

  constructor(
    private userInformationService: UserInformationService, 
    private router: Router,
    private loginService: LoginService,
    private http: HttpClient,
    private notificationService: NotificationService
  ) { 
    this.updateVillage();
  }
  
  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
    this.unreadSubscription?.unsubscribe();
    this.notificationSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.userInformationService.villageChanged$.subscribe(()=>{
      this.updateVillage();
    });
    
    // Load unread count initially and refresh every 30 seconds
    this.loadUnreadCount();
    this.unreadSubscription = timer(30000, 30000).subscribe(() => {
      this.loadUnreadCount();
    });

    // Immediately decrement count when an item is marked as read
    this.notificationSubscription = this.notificationService.onItemRead$.subscribe(() => {
      if (this.unreadCount > 0) {
        this.unreadCount--;
      }
    });
  }

  loadUnreadCount(): void {
    const username = this.userInformationService.userInformation.username;
    forkJoin({
      messages: this.http.get<number>(`${environment.apiUrl}/messages/${username}/unread`),
      reports: this.http.get<number>(`${environment.apiUrl}/reports/unread/${username}`)
    }).subscribe({
      next: (result) => {
        this.unreadCount = result.messages + result.reports;
      },
      error: () => {
        this.unreadCount = 0;
      }
    });
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

  currentTheme(): string {
    return this.userInformationService.userInformation?.theme || 'default';
  }

  changeTheme(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const theme = select.value || 'default';
    this.http.post(`${environment.apiUrl}/users/theme`, { theme }).subscribe({
      next: () => {
        (this.userInformationService.userInformation as any).theme = theme;
        if (typeof document !== 'undefined' && document.body) {
          document.body.setAttribute('data-theme', theme);
        }
        sessionStorage.setItem('user_info', JSON.stringify(this.userInformationService.userInformation));
      }
    });
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
    // Apply Vanguard energy production multiplier if available
    const energyMultiplier = this.userInformationService.userInformation.energyProductionMultiplier || 1;
    let secondsLeft: number = energyLeftTillNext / (energyProductionSpeedPerSecond * energyMultiplier);
    let currentDate: Date = new Date();
    let dateWhenNextEnergy: Date = new Date();
    dateWhenNextEnergy.setSeconds(dateWhenNextEnergy.getSeconds() + secondsLeft);
    return +dateWhenNextEnergy - +currentDate;
  }

  // Calculate time until max for resources/energy
  getTimeUntilMaxEnergy(): string | null {
    const current = this.getEnergy();
    if (current >= this.maxEnergy) return null;
    
    const remaining = this.maxEnergy - current;
    // Apply Vanguard energy production multiplier if available
    const energyMultiplier = this.userInformationService.userInformation.energyProductionMultiplier || 1;
    const effectiveEnergySpeed = energyProductionSpeedPerSecond * energyMultiplier;
    const secondsUntilMax = remaining / effectiveEnergySpeed;
    return this.formatTimeUntilMax(secondsUntilMax);
  }

  getTimeUntilMaxWood(): string | null {
    const village = this.userInformationService.currentVillage;
    if (village.resourcesAmounts.woodAmount >= this.maxWoodStorage) return null;
    if (village.woodProductionPerSecond <= 0) return null;
    
    const remaining = this.maxWoodStorage - village.resourcesAmounts.woodAmount;
    const secondsUntilMax = remaining / village.woodProductionPerSecond;
    return this.formatTimeUntilMax(secondsUntilMax);
  }

  getTimeUntilMaxStone(): string | null {
    const village = this.userInformationService.currentVillage;
    if (village.resourcesAmounts.stonesAmount >= this.maxStonesStorage) return null;
    if (village.stoneProductionPerSecond <= 0) return null;
    
    const remaining = this.maxStonesStorage - village.resourcesAmounts.stonesAmount;
    const secondsUntilMax = remaining / village.stoneProductionPerSecond;
    return this.formatTimeUntilMax(secondsUntilMax);
  }

  getTimeUntilMaxCrop(): string | null {
    const village = this.userInformationService.currentVillage;
    if (village.resourcesAmounts.cropAmount >= this.maxCropStorage) return null;
    if (village.cropProductionPerSecond <= 0) return null;
    
    const remaining = this.maxCropStorage - village.resourcesAmounts.cropAmount;
    const secondsUntilMax = remaining / village.cropProductionPerSecond;
    return this.formatTimeUntilMax(secondsUntilMax);
  }

  formatTimeUntilMax(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `Max in ${hours}h ${minutes}m`;
    } else {
      return `Max in ${minutes}m`;
    }
  }

}
