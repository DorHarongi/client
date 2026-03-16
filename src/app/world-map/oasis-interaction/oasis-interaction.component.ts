import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TroopsAmounts } from 'src/app/main-panel/models/troopsAmounts';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { environment } from 'src/environments/environment';
import {
  archerAttackingStat,
  archerDefenceStat,
  axeFighterAttackingStat,
  axeFighterDefenceStat,
  calculateDistance,
  calculateTravelTimeMs,
  catapultsAttackingStat,
  catapultsDefenceStat,
  getArmySpeed,
  getSkillBonus,
  horsemenAttackingStat,
  horsemenDefenceStat,
  magicianAttackingStat,
  magicianDefenceStat,
  SkillCategory,
  spearFighterAttackingStat,
  spearFighterDefenceStat,
  swordFighterAttackingStat,
  swordFighterDefenceStat,
  oasisTierConfigs,
  OasisTier,
  OASIS_HARVEST_RATE_PER_TROOP_PER_HOUR,
  warehouseStorageByLevel,
} from 'utils';
import { OasisOnMap } from '../models/mapModels';

const SYNC_INTERVAL_MS = 15_000;

@Component({
  selector: 'app-oasis-interaction',
  templateUrl: './oasis-interaction.component.html',
  styleUrls: ['./oasis-interaction.component.scss'],
})
export class OasisInteractionComponent implements OnInit, OnDestroy {
  @Input() oasis!: OasisOnMap;
  @Input() currentUsername!: string;
  @Output() closed: EventEmitter<void> = new EventEmitter<void>();

  oasisInfo: any = null;
  scouting: boolean = false;
  sending: boolean = false;
  retreating: boolean = false;
  errorMessage: string = '';

  showRetreatConfirm: boolean = false;
  showWithdrawModal: boolean = false;
  selectedWithdrawVillages: Set<string> = new Set();
  retreatStash: { wood: number; stone: number; crop: number } = { wood: 0, stone: 0, crop: 0 };

  get retreatOverflow(): { wood: number; stone: number; crop: number } {
    const village = this.userInformationService.currentVillage;
    const levels = village.buildingsLevels;
    const maxWood = warehouseStorageByLevel[levels.woodWarehouseLevel] || 0;
    const maxStone = warehouseStorageByLevel[levels.stoneWarehouseLevel] || 0;
    const maxCrop = warehouseStorageByLevel[levels.cropWarehouseLevel] || 0;
    const freeWood = Math.max(0, maxWood - village.resourcesAmounts.woodAmount);
    const freeStone = Math.max(0, maxStone - village.resourcesAmounts.stonesAmount);
    const freeCrop = Math.max(0, maxCrop - village.resourcesAmounts.cropAmount);
    return {
      wood: Math.max(0, this.retreatStash.wood - freeWood),
      stone: Math.max(0, this.retreatStash.stone - freeStone),
      crop: Math.max(0, this.retreatStash.crop - freeCrop),
    };
  }

  get hasOverflow(): boolean {
    const o = this.retreatOverflow;
    return o.wood > 0 || o.stone > 0 || o.crop > 0;
  }

  showInfo: boolean = false;
  oasisInfoLines: string[] = [
    'An oasis can be controlled by one player at a time. To conquer it, you must defeat the army of its current owner.',
    'Once you control an oasis, your troops will start looting it. The more troops you station there, the faster the looting.',
    'Each village can only support one oasis at a time. You can reinforce the same oasis from multiple villages, but each village is locked to that oasis until you withdraw its troops.',
    'You can withdraw troops at any time and they will carry back the resources they have gathered so far.',
    'Each oasis has a limited pool of resources. Higher rarity oases contain significantly more resources.',
    'Once all resources have been looted, the oasis disappears.',
    'You cannot tell whether an oasis is already claimed just by looking at the map. Scout it first to gather information before sending your troops.',
  ];
  showSendTroopsPanel: boolean = false;
  maxPossibleTroops!: TroopsAmounts;
  chosenTroops!: TroopsAmounts;

  totalAttack: number = 0;
  totalDefense: number = 0;
  armySpeed: number = 0;
  travelTimeMs: number = 0;

  private subscription?: Subscription;
  private harvestInterval: any;
  private syncInterval: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private userInformationService: UserInformationService,
  ) {}

  ngOnInit(): void {
    this.initMaxTroops();
    if (this.oasis.ownerType === 'clan' || this.oasis.ownerType === 'mine') {
      this.fetchOasisInfo();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.stopHarvestTimer();
  }

  private startHarvestTimer(): void {
    this.stopHarvestTimer();
    if (!this.isOccupier || !this.oasisInfo?.garrison) return;

    this.harvestInterval = setInterval(() => {
      this.tickLocalHarvest();
    }, 1000);

    this.syncInterval = setInterval(() => {
      this.syncFromServer();
    }, SYNC_INTERVAL_MS);
  }

  private stopHarvestTimer(): void {
    if (this.harvestInterval) { clearInterval(this.harvestInterval); this.harvestInterval = null; }
    if (this.syncInterval) { clearInterval(this.syncInterval); this.syncInterval = null; }
  }

  private tickLocalHarvest(): void {
    if (!this.oasisInfo?.garrison || !this.oasisInfo.resourcesRemaining) return;

    const troops = this.totalGarrisonTroops;
    const troopCount = this.getTotalTroopCount(troops);
    if (troopCount <= 0) return;

    const harvestPerSecond = (troopCount * OASIS_HARVEST_RATE_PER_TROOP_PER_HOUR) / 3600;
    const remaining = this.oasisInfo.resourcesRemaining;
    const stash = this.oasisInfo.garrison.stash;

    for (const res of ['wood', 'stone', 'crop'] as const) {
      const harvested = Math.min(harvestPerSecond, remaining[res] || 0);
      remaining[res] = Math.max(0, (remaining[res] || 0) - harvested);
      stash[res] = (stash[res] || 0) + harvested;
    }
  }

  private syncFromServer(): void {
    if (!this.isOccupier) return;
    this.http.get<any>(`${environment.apiUrl}/oasis/info/${this.oasis.id}`)
      .subscribe({
        next: (info) => { this.oasisInfo = info; },
        error: () => {},
      });
  }

  initMaxTroops(): void {
    const userTroops = this.userInformationService.currentVillage.troops;
    this.maxPossibleTroops = new TroopsAmounts(
      userTroops.spearFighters,
      userTroops.swordFighters,
      userTroops.axeFighters,
      userTroops.archers,
      userTroops.magicians,
      userTroops.horsemen,
      userTroops.catapults,
    );
  }

  findOnMap(): void {
    this.router.navigate(['Map'], {
      queryParams: { x: this.oasis.x, y: this.oasis.y },
    });
  }

  scout(): void {
    if (this.oasis.ownerType === 'clan' || this.oasis.ownerType === 'mine') {
      this.fetchOasisInfo();
      return;
    }

    this.scouting = true;
    this.errorMessage = '';
    const villageName = this.userInformationService.currentVillage?.villageName;
    if (!villageName) {
      this.errorMessage = 'Could not determine your current village.';
      this.scouting = false;
      return;
    }

    this.subscription = this.http
      .post<any>(`${environment.apiUrl}/scouting/scout-oasis`, {
        attackerVillageName: villageName,
        oasisId: this.oasis.id,
      })
      .subscribe({
        next: () => {
          this.scouting = false;
          this.userInformationService.currentVillage.aliveSpies = Math.max(
            0,
            (this.userInformationService.currentVillage.aliveSpies || 0) - 1
          );
          this.userInformationService.notifyVillageChanged();
          this.closed.emit();
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to spy on oasis';
          this.scouting = false;
        },
      });
  }

  private fetchOasisInfo(): void {
    this.scouting = true;
    this.errorMessage = '';
    this.subscription = this.http
      .get<any>(`${environment.apiUrl}/oasis/info/${this.oasis.id}`)
      .subscribe({
        next: (info) => {
          this.oasisInfo = info;
          this.scouting = false;
          this.startHarvestTimer();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load oasis info';
          this.scouting = false;
        },
      });
  }

  openSendTroopsPanel(): void {
    this.showSendTroopsPanel = true;
    this.errorMessage = '';
  }

  cancelPanel(): void {
    this.showSendTroopsPanel = false;
    this.errorMessage = '';
  }

  troopsChanged(troops: TroopsAmounts): void {
    this.chosenTroops = troops;
    this.updateMaximumPossibleTroops();
    this.updateTotalStats();
    this.updateTravelStats();
  }

  updateTotalStats(): void {
    if (!this.chosenTroops) {
      this.totalAttack = 0;
      this.totalDefense = 0;
      return;
    }
    this.totalAttack =
      this.chosenTroops.spearFighters * spearFighterAttackingStat +
      this.chosenTroops.swordFighters * swordFighterAttackingStat +
      this.chosenTroops.axeFighters * axeFighterAttackingStat +
      this.chosenTroops.archers * archerAttackingStat +
      this.chosenTroops.magicians * magicianAttackingStat +
      this.chosenTroops.horsemen * horsemenAttackingStat +
      this.chosenTroops.catapults * catapultsAttackingStat;

    this.totalDefense =
      this.chosenTroops.spearFighters * spearFighterDefenceStat +
      this.chosenTroops.swordFighters * swordFighterDefenceStat +
      this.chosenTroops.axeFighters * axeFighterDefenceStat +
      this.chosenTroops.archers * archerDefenceStat +
      this.chosenTroops.magicians * magicianDefenceStat +
      this.chosenTroops.horsemen * horsemenDefenceStat +
      this.chosenTroops.catapults * catapultsDefenceStat;
  }

  updateTravelStats(): void {
    if (!this.chosenTroops) {
      this.armySpeed = 0;
      this.travelTimeMs = 0;
      return;
    }

    const currentVillage = this.userInformationService.currentVillage;
    if (!currentVillage?.location) {
      this.armySpeed = 0;
      this.travelTimeMs = 0;
      return;
    }

    this.armySpeed = getArmySpeed(this.chosenTroops as any);
    if (this.armySpeed <= 0) {
      this.travelTimeMs = 0;
      return;
    }

    const distance = calculateDistance(
      currentVillage.location.x,
      currentVillage.location.y,
      this.oasis.x,
      this.oasis.y,
    );

    const skills = (currentVillage as any)?.skills;
    const quickStepBonus = skills
      ? getSkillBonus(skills, SkillCategory.QUICK_STEP)
      : 0;
    this.travelTimeMs = calculateTravelTimeMs(
      distance,
      this.armySpeed,
      quickStepBonus,
    );
  }

  getFormattedTravelTime(): string {
    if (!this.travelTimeMs || this.travelTimeMs <= 0) {
      return '—';
    }
    const totalSeconds = Math.floor(this.travelTimeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  updateMaximumPossibleTroops(): void {
    const current = this.userInformationService.currentVillage.troops;
    this.maxPossibleTroops.spearFighters =
      current.spearFighters - this.chosenTroops.spearFighters;
    this.maxPossibleTroops.swordFighters =
      current.swordFighters - this.chosenTroops.swordFighters;
    this.maxPossibleTroops.axeFighters =
      current.axeFighters - this.chosenTroops.axeFighters;
    this.maxPossibleTroops.archers =
      current.archers - this.chosenTroops.archers;
    this.maxPossibleTroops.magicians =
      current.magicians - this.chosenTroops.magicians;
    this.maxPossibleTroops.horsemen =
      current.horsemen - this.chosenTroops.horsemen;
    this.maxPossibleTroops.catapults =
      current.catapults - this.chosenTroops.catapults;
  }

  hasSelectedTroops(): boolean {
    if (!this.chosenTroops) return false;
    const total =
      this.chosenTroops.spearFighters +
      this.chosenTroops.swordFighters +
      this.chosenTroops.axeFighters +
      this.chosenTroops.archers +
      this.chosenTroops.magicians +
      this.chosenTroops.horsemen +
      this.chosenTroops.catapults;
    return total > 0;
  }

  sendTroops(): void {
    if (!this.hasSelectedTroops()) return;
    this.sending = true;
    this.errorMessage = '';

    const villageName = this.userInformationService.currentVillage?.villageName;
    if (!villageName) {
      this.errorMessage = 'Could not determine your current village.';
      this.sending = false;
      return;
    }

    this.subscription = this.http
      .post<any>(`${environment.apiUrl}/oasis/garrison`, {
        villageName,
        oasisId: this.oasis.id,
        troops: this.chosenTroops,
      })
      .subscribe({
        next: (result) => {
          this.sending = false;
          if (result?.user) {
            this.userInformationService.setUserInformation(result.user);
          }
          this.closed.emit();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to send troops';
          this.sending = false;
        },
      });
  }

  get isOccupier(): boolean {
    return !!this.oasisInfo?.garrison &&
      this.oasisInfo.garrison.username === this.currentUsername;
  }

  get villageAlreadyAtOtherOasis(): boolean {
    const village = this.userInformationService.currentVillage;
    if (!village?.oasisTroopsSent || village.oasisTroopsSent.length === 0) return false;
    if (this.isOccupier) {
      return village.oasisTroopsSent.some(e => e.oasisId !== this.oasis.id);
    }
    return village.oasisTroopsSent.length > 0;
  }

  get hasMultipleContributions(): boolean {
    return this.garrisonContributions.length > 1;
  }

  get isClanOwned(): boolean {
    return this.oasis.ownerType === 'clan' || !!this.oasisInfo?.clanOwner;
  }

  get clanOwnerName(): string {
    return this.oasisInfo?.clanOwner || '';
  }

  getTotalTroopCount(troops: any): number {
    if (!troops) return 0;
    return (troops.spearFighters || 0) +
      (troops.swordFighters || 0) +
      (troops.axeFighters || 0) +
      (troops.archers || 0) +
      (troops.magicians || 0) +
      (troops.horsemen || 0) +
      (troops.catapults || 0);
  }

  get garrisonContributions(): any[] {
    if (!this.oasisInfo?.garrison) return [];
    const g = this.oasisInfo.garrison;
    if (g.contributions && g.contributions.length > 0) {
      return g.contributions;
    }
    if (g.villageName && g.troops) {
      return [{ villageName: g.villageName, troops: g.troops }];
    }
    return [];
  }

  get totalGarrisonTroops(): any {
    const contribs = this.garrisonContributions;
    const total = { spearFighters: 0, swordFighters: 0, axeFighters: 0, archers: 0, magicians: 0, horsemen: 0, catapults: 0 };
    for (const c of contribs) {
      total.spearFighters += c.troops?.spearFighters || 0;
      total.swordFighters += c.troops?.swordFighters || 0;
      total.axeFighters += c.troops?.axeFighters || 0;
      total.archers += c.troops?.archers || 0;
      total.magicians += c.troops?.magicians || 0;
      total.horsemen += c.troops?.horsemen || 0;
      total.catapults += c.troops?.catapults || 0;
    }
    return total;
  }

  getLootedAmount(resource: 'wood' | 'stone' | 'crop'): number {
    if (!this.oasisInfo?.garrison?.totalForOccupier || !this.oasisInfo?.resourcesRemaining) return 0;
    return this.oasisInfo.garrison.totalForOccupier[resource] - this.oasisInfo.resourcesRemaining[resource];
  }

  getTotalForOccupier(resource: 'wood' | 'stone' | 'crop'): number {
    if (!this.oasisInfo?.garrison?.totalForOccupier) return 0;
    return this.oasisInfo.garrison.totalForOccupier[resource];
  }

  onRetreatClick(): void {
    if (this.retreating) return;

    if (this.hasMultipleContributions) {
      this.selectedWithdrawVillages = new Set();
      this.showWithdrawModal = true;
      return;
    }

    this.openRetreatConfirm();
  }

  private openRetreatConfirm(): void {
    const stash = this.oasisInfo?.garrison?.stash || { wood: 0, stone: 0, crop: 0 };
    this.retreatStash = {
      wood: Math.round(stash.wood || 0),
      stone: Math.round(stash.stone || 0),
      crop: Math.round(stash.crop || 0),
    };
    this.showRetreatConfirm = true;
  }

  cancelRetreatConfirm(): void {
    this.showRetreatConfirm = false;
  }

  confirmRetreat(): void {
    this.showRetreatConfirm = false;
    if (this.retreating) return;
    this.retreating = true;
    this.errorMessage = '';

    this.subscription = this.http
      .post<any>(`${environment.apiUrl}/oasis/retreat`, {
        oasisId: this.oasis.id,
      })
      .subscribe({
        next: () => {
          this.retreating = false;
          this.closed.emit();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to retreat';
          this.retreating = false;
        },
      });
  }

  toggleWithdrawVillage(villageName: string): void {
    if (this.selectedWithdrawVillages.has(villageName)) {
      this.selectedWithdrawVillages.delete(villageName);
    } else {
      this.selectedWithdrawVillages.add(villageName);
    }
  }

  isVillageSelectedForWithdraw(villageName: string): boolean {
    return this.selectedWithdrawVillages.has(villageName);
  }

  closeWithdrawModal(): void {
    this.showWithdrawModal = false;
    this.selectedWithdrawVillages.clear();
  }

  withdrawSelected(): void {
    if (this.selectedWithdrawVillages.size === 0 || this.retreating) return;
    this.doWithdraw(Array.from(this.selectedWithdrawVillages));
  }

  withdrawAll(): void {
    if (this.retreating) return;
    this.showWithdrawModal = false;
    this.openRetreatConfirm();
  }

  private doWithdraw(villageNames: string[]): void {
    this.retreating = true;
    this.errorMessage = '';

    this.subscription = this.http
      .post<any>(`${environment.apiUrl}/oasis/retreat`, {
        oasisId: this.oasis.id,
        villageNames,
      })
      .subscribe({
        next: () => {
          this.retreating = false;
          this.showWithdrawModal = false;
          this.selectedWithdrawVillages.clear();
          this.closed.emit();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to withdraw troops';
          this.retreating = false;
        },
      });
  }

  get oasisName(): string {
    const tier = this.oasis.tier || this.oasisInfo?.tier;
    if (tier && oasisTierConfigs[tier as OasisTier]) {
      return oasisTierConfigs[tier as OasisTier].name;
    }
    return 'Oasis';
  }

  get oasisRarity(): string {
    const tier = this.oasis.tier || this.oasisInfo?.tier;
    if (tier && oasisTierConfigs[tier as OasisTier]) {
      return oasisTierConfigs[tier as OasisTier].rarity;
    }
    return '';
  }

  get rarityClass(): string {
    switch (this.oasisRarity) {
      case 'Common': return 'rarity-common';
      case 'Rare': return 'rarity-rare';
      case 'Epic': return 'rarity-epic';
      case 'Legendary': return 'rarity-legendary';
      default: return '';
    }
  }

  close(): void {
    this.closed.emit();
  }
}
