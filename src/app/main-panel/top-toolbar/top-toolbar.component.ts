import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, interval, Subscription, timer } from 'rxjs';
import { LoginService } from 'src/app/login/login.service';
import { NotificationService } from 'src/app/services/notification.service';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { environment } from 'src/environments/environment';
import {
  energyProductionSpeedPerSecond,
  getMaxSpies,
  maxEnergy,
  quartersPopulationByLevel,
  SPY_REGEN_TIME_MS,
  warehouseStorageByLevel,
} from 'utils';
import { ResourcesAmounts } from '../models/resourcesAmounts';
import { Village } from '../models/Village';

@Component({
  selector: 'app-top-toolbar',
  templateUrl: './top-toolbar.component.html',
  styleUrls: ['./top-toolbar.component.scss'],
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

  stableLevel: number = 0;
  aliveSpies: number = 0;
  maxSpies: number = 0;
  spyTooltipText: string = 'Spy capacity';
  spyRegenCountdown: string = '';

  subscription!: Subscription;
  unreadSubscription?: Subscription;
  notificationSubscription?: Subscription;
  spyCountdownSubscription?: Subscription;
  private visibilityHandler = () => this.onVisibilityChange();

  constructor(
    private userInformationService: UserInformationService,
    private router: Router,
    private loginService: LoginService,
    private http: HttpClient,
    private notificationService: NotificationService,
  ) {
    this.updateVillage();
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
    this.stopTimers();
    this.notificationSubscription?.unsubscribe();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  ngOnInit(): void {
    this.subscription = this.userInformationService.villageChanged$.subscribe(
      () => {
        this.updateVillage();
      }
    );

    this.loadUnreadCount();
    this.startTimers();

    // Immediately decrement count when an item is marked as read
    this.notificationSubscription =
      this.notificationService.onItemRead$.subscribe(() => {
        if (this.unreadCount > 0) {
          this.unreadCount--;
        }
      });

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private onVisibilityChange(): void {
    if (document.hidden) {
      this.stopTimers();
    } else {
      this.loadUnreadCount();
      this.startTimers();
    }
  }

  private startTimers(): void {
    this.stopTimers();
    this.unreadSubscription = timer(30000, 30000).subscribe(() => {
      this.loadUnreadCount();
    });
    this.updateSpyTooltip();
    this.spyCountdownSubscription = interval(1000).subscribe(() =>
      this.updateSpyTooltip()
    );
  }

  private stopTimers(): void {
    this.unreadSubscription?.unsubscribe();
    this.unreadSubscription = undefined;
    this.spyCountdownSubscription?.unsubscribe();
    this.spyCountdownSubscription = undefined;
  }

  private updateSpyTooltip(): void {
    this.spyTooltipText = this.getSpyRegenTooltip();
    this.spyRegenCountdown = this.getSpyRegenCountdownVisible();
  }

  getSpyRegenCountdownVisible(): string {
    if (this.stableLevel <= 0 || this.aliveSpies >= this.maxSpies) return '';
    const timestamps = this.spyDeathTimestamps
      .map((t) =>
        typeof t === 'string' ? new Date(t).getTime() : (t as Date).getTime()
      )
      .sort((a, b) => a - b);
    if (timestamps.length === 0) return '';
    const now = Date.now();
    const nextRegenAt = timestamps[0] + SPY_REGEN_TIME_MS;
    const msLeft = Math.max(0, nextRegenAt - now);
    if (msLeft <= 0) return '';
    const h = Math.floor(msLeft / 3600000);
    const m = Math.floor((msLeft % 3600000) / 60000);
    const s = Math.floor((msLeft % 60000) / 1000);
    return `Next in: ${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  loadUnreadCount(): void {
    const username = this.userInformationService.userInformation.username;
    forkJoin({
      messages: this.http.get<number>(
        `${environment.apiUrl}/messages/${username}/unread`
      ),
      reports: this.http.get<number>(
        `${environment.apiUrl}/reports/unread/${username}`
      ),
    }).subscribe({
      next: (result) => {
        this.unreadCount = result.messages + result.reports;
      },
      error: () => {
        this.unreadCount = 0;
      },
    });
  }

  goToStatistics() {
    this.router.navigate(['Statistics']);
  }

  goToMessages() {
    this.router.navigate(['Inbox']);
  }

  isRoute(route: string): boolean {
    return this.router.url === '/' + route;
  }

  goToHome() {
    this.router.navigate(['home']);
  }

  goToMap() {
    this.router.navigate(['Map']);
  }

  logout() {
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
        sessionStorage.setItem(
          'user_info',
          JSON.stringify(this.userInformationService.userInformation)
        );
      },
    });
  }

  updateVillage() {
    let village: Village = this.userInformationService.currentVillage;

    this.resources = village.resourcesAmounts;

    this.maxWoodStorage =
      warehouseStorageByLevel[village.buildingsLevels.woodWarehouseLevel];
    this.maxStonesStorage =
      warehouseStorageByLevel[village.buildingsLevels.stoneWarehouseLevel];
    this.maxCropStorage =
      warehouseStorageByLevel[village.buildingsLevels.cropWarehouseLevel];
    this.maxEnergy = maxEnergy;

    this.maximumPopulation =
      quartersPopulationByLevel[village.buildingsLevels.quartersLevel];
    this.usedPopulation =
      Village.getTotalTroops(village) +
      Village.getTotalWorkers(village) +
      Village.getTotalSupportSent(village) +
      Village.getTotalOasisTroops(village) +
      (village.troopsInTransit || 0);

    this.stableLevel = village.buildingsLevels?.stableLevel ?? 0;
    this.maxSpies = this.stableLevel > 0 ? getMaxSpies(this.stableLevel) : 0;
    this.aliveSpies = village.aliveSpies ?? 0;
    this.spyDeathTimestamps = (village as any).spyDeathTimestamps || [];
    this.updateSpyTooltip();
  }

  spyDeathTimestamps: Date[] = [];

  getSpyRegenTooltip(): string {
    if (this.stableLevel <= 0 || this.aliveSpies >= this.maxSpies) {
      return 'Spy capacity';
    }
    const timestamps = this.spyDeathTimestamps
      .map((t) =>
        typeof t === 'string' ? new Date(t).getTime() : (t as Date).getTime()
      )
      .sort((a, b) => a - b);
    if (timestamps.length === 0) {
      return 'Spies on mission. They will return once the mission is complete.';
    }
    const now = Date.now();
    const nextRegenAt = timestamps[0] + SPY_REGEN_TIME_MS;
    const deadCount = timestamps.filter(
      (ts) => ts + SPY_REGEN_TIME_MS > now
    ).length;
    if (deadCount === 0) return 'Spy capacity';
    const msLeft = Math.max(0, nextRegenAt - now);
    const h = Math.floor(msLeft / 3600000);
    const m = Math.floor((msLeft % 3600000) / 60000);
    const timeStr =
      h > 0 ? `${h} hour${h > 1 ? 's' : ''} ${m} min` : `${m} min`;
    return `Your next spy will be available in ${timeStr}`;
  }

  getEnergy(): number {
    return this.userInformationService.userInformation.energy;
  }

  getTimeTillNextEnergy(): number {
    let currentEnergy: number = this.getEnergy();
    let energyLeftTillNext: number = 1 - (currentEnergy % 1);
    // Apply Vanguard energy production multiplier if available
    const energyMultiplier =
      this.userInformationService.userInformation.energyProductionMultiplier ||
      1;
    let secondsLeft: number =
      energyLeftTillNext / (energyProductionSpeedPerSecond * energyMultiplier);
    let currentDate: Date = new Date();
    let dateWhenNextEnergy: Date = new Date();
    dateWhenNextEnergy.setSeconds(
      dateWhenNextEnergy.getSeconds() + secondsLeft
    );
    return +dateWhenNextEnergy - +currentDate;
  }

  // Calculate time until max for resources/energy
  getTimeUntilMaxEnergy(): string | null {
    const current = this.getEnergy();
    if (current >= this.maxEnergy) return null;

    const remaining = this.maxEnergy - current;
    // Apply Vanguard energy production multiplier if available
    const energyMultiplier =
      this.userInformationService.userInformation.energyProductionMultiplier ||
      1;
    const effectiveEnergySpeed =
      energyProductionSpeedPerSecond * energyMultiplier;
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
    if (village.resourcesAmounts.stonesAmount >= this.maxStonesStorage)
      return null;
    if (village.stoneProductionPerSecond <= 0) return null;

    const remaining =
      this.maxStonesStorage - village.resourcesAmounts.stonesAmount;
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
