import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { ExpertSpyService, ExpertSpyStatus } from 'src/app/services/expert-spy.service';
import {
  getMaxSpies,
  SPY_SPEED,
  stableDetectionReductionByLevel,
  stableMaxSpiesByLevel,
  stableUpgradeMaterialCostByLevels,
} from 'utils';
import { Building } from '../../classes/Building';

@Component({
  selector: 'app-stable',
  templateUrl: './stable.component.html',
  styleUrls: ['./stable.component.scss'],
})
export class StableComponent implements OnInit, OnDestroy {
  buildingInformation: Building;
  stableLevel: number;
  maxSpies: number = 0;
  currentReduction: number = 0;
  reductionPerLevel: number = 2;
  nextLevelReduction: number = 0;
  nextLevelUnlocksSpy: boolean = false;
  nextLevelSpies: number = 0;
  isMaxLevel: boolean = false;

  expertSpyStatus: ExpertSpyStatus | null = null;
  showDeployModal: boolean = false;
  deployTargetUsername: string = '';
  deployTargetVillageName: string = '';
  deployTargetType: 'village' | 'oasis' = 'village';
  deployTargetOasisId: string = '';
  deployError: string = '';
  deploying: boolean = false;
  private villageSubscription?: Subscription;

  constructor(
    private userInformationService: UserInformationService,
    private expertSpyService: ExpertSpyService
  ) {
    this.stableLevel =
      this.userInformationService.currentVillage.buildingsLevels.stableLevel;
    const maxLevel = stableDetectionReductionByLevel.length - 1;
    this.isMaxLevel = this.stableLevel >= maxLevel;

    this.buildingInformation = new Building(
      'stable',
      'Stable',
      this.stableLevel,
      `The Stable trains and houses your spies. Higher levels reduce enemy spy detection chance and unlock more spy capacity. Spy movement speed: ${SPY_SPEED} tiles/min.`,
      stableUpgradeMaterialCostByLevels[this.stableLevel + 1]
    );

    this.maxSpies = getMaxSpies(this.stableLevel);
    this.currentReduction =
      stableDetectionReductionByLevel[this.stableLevel] ?? 0;

    if (!this.isMaxLevel) {
      this.nextLevelReduction =
        stableDetectionReductionByLevel[this.stableLevel + 1] ?? 0;
      const currentSpies = stableMaxSpiesByLevel[this.stableLevel] ?? 0;
      this.nextLevelSpies = stableMaxSpiesByLevel[this.stableLevel + 1] ?? 0;
      this.nextLevelUnlocksSpy = this.nextLevelSpies > currentSpies;
    }
  }

  ngOnInit(): void {
    this.loadExpertSpyStatus();
    this.villageSubscription = this.userInformationService.villageChanged$.subscribe(
      () => {
        this.stableLevel =
          this.userInformationService.currentVillage?.buildingsLevels?.stableLevel ?? 0;
        this.loadExpertSpyStatus();
      }
    );
  }

  ngOnDestroy(): void {
    this.villageSubscription?.unsubscribe();
  }

  loadExpertSpyStatus(): void {
    if (this.stableLevel < 5) return;
    const villageName = this.userInformationService.currentVillage?.villageName;
    if (!villageName) return;
    this.expertSpyService.getExpertSpyStatus(villageName).subscribe({
      next: (status) => (this.expertSpyStatus = status),
      error: () => (this.expertSpyStatus = null),
    });
  }

  refreshExpertSpyStatus(): void {
    this.loadExpertSpyStatus();
  }

  openDeployModal(): void {
    this.showDeployModal = true;
    this.deployError = '';
    this.deployTargetUsername = '';
    this.deployTargetVillageName = '';
    this.deployTargetType = 'village';
    this.deployTargetOasisId = '';
  }

  closeDeployModal(): void {
    this.showDeployModal = false;
    this.deployError = '';
  }

  deployExpertSpy(): void {
    const villageName = this.userInformationService.currentVillage?.villageName;
    if (!villageName || this.deploying) return;
    if (!this.deployTargetUsername.trim() || !this.deployTargetVillageName.trim()) {
      this.deployError = 'Please enter target username and village name.';
      return;
    }
    this.deployError = '';
    this.deploying = true;
    this.expertSpyService
      .deployExpertSpy(
        villageName,
        this.deployTargetUsername.trim(),
        this.deployTargetVillageName.trim(),
        this.deployTargetType,
        this.deployTargetOasisId?.trim() || undefined
      )
      .subscribe({
        next: () => {
          this.deploying = false;
          this.closeDeployModal();
          this.loadExpertSpyStatus();
        },
        error: (err) => {
          this.deploying = false;
          this.deployError = err.error?.message || 'Failed to deploy Expert Spy';
        },
      });
  }

  getExpertSpyCountdown(): string {
    if (!this.expertSpyStatus?.returnsAt) return '--';
    const ms = new Date(this.expertSpyStatus.returnsAt).getTime() - Date.now();
    if (ms <= 0) return 'Returning...';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  getExpertSpyCooldown(): string {
    if (!this.expertSpyStatus?.cooldownEndsAt) return '--';
    const ms = new Date(this.expertSpyStatus.cooldownEndsAt).getTime() - Date.now();
    if (ms <= 0) return 'Ready soon...';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }
}
