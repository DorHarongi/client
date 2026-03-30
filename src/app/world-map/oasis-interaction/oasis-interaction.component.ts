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
  get retreatStash(): { wood: number; stone: number; crop: number } {
    const stash = this.oasisInfo?.garrison?.stash;
    if (!stash) return { wood: 0, stone: 0, crop: 0 };
    return {
      wood: Math.floor(stash.wood || 0),
      stone: Math.floor(stash.stone || 0),
      crop: Math.floor(stash.crop || 0),
    };
  }

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
    this.fetchOasisInfo(false);
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

    const contribs = this.garrisonContributions;
    const contribCounts = contribs.map((c: any) => this.getTotalTroopCount(c.troops));

    for (const res of ['wood', 'stone', 'crop'] as const) {
      const harvested = Math.min(harvestPerSecond, remaining[res] || 0);
      remaining[res] = Math.max(0, (remaining[res] || 0) - harvested);
      stash[res] = (stash[res] || 0) + harvested;

      for (let i = 0; i < contribs.length; i++) {
        if (!contribs[i].stash) contribs[i].stash = { wood: 0, stone: 0, crop: 0 };
        const ratio = troopCount > 0 ? contribCounts[i] / troopCount : 0;
        contribs[i].stash[res] = (contribs[i].stash[res] || 0) + harvested * ratio;
      }
    }
  }

  private syncFromServer(): void {
    if (!this.isOccupier) return;
    const villageName = this.userInformationService.currentVillage?.villageName || '';
    this.http.get<any>(`${environment.apiUrl}/oasis/info/${this.oasis.id}`, { params: { villageName } })
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

  private fetchOasisInfo(showScouting: boolean = true): void {
    if (showScouting) this.scouting = true;
    this.errorMessage = '';
    const villageName = this.userInformationService.currentVillage?.villageName || '';
    this.subscription = this.http
      .get<any>(`${environment.apiUrl}/oasis/info/${this.oasis.id}`, { params: { villageName } })
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
    this.chosenTroops = null!;
    this.initMaxTroops();
  }

  troopsChanged(troops: TroopsAmounts): void {
    this.chosenTroops = troops;
    this.updateMaximumPossibleTroops();
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
    return !!this.oasisInfo?.villageAtOtherOasis;
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

  getVillageResourceShare(villageName: string): { wood: number; stone: number; crop: number } {
    const contribs = this.garrisonContributions;
    const stash = this.retreatStash;
    if (contribs.length <= 1) return stash;

    const totalContribStash = contribs.reduce(
      (sum: number, c: any) => sum + (c.stash?.wood || 0) + (c.stash?.stone || 0) + (c.stash?.crop || 0), 0,
    );
    const totalGarrisonStash = stash.wood + stash.stone + stash.crop;

    if (totalContribStash >= totalGarrisonStash * 0.5 && totalContribStash > 0) {
      const contrib = contribs.find((c: any) => c.villageName === villageName);
      if (!contrib?.stash) return { wood: 0, stone: 0, crop: 0 };
      return {
        wood: Math.floor(contrib.stash.wood || 0),
        stone: Math.floor(contrib.stash.stone || 0),
        crop: Math.floor(contrib.stash.crop || 0),
      };
    }

    const troopCounts = contribs.map((c: any) => this.getTotalTroopCount(c.troops));
    const grandTotal = troopCounts.reduce((a: number, b: number) => a + b, 0);
    if (grandTotal <= 0) return { wood: 0, stone: 0, crop: 0 };
    const idx = contribs.findIndex((c: any) => c.villageName === villageName);
    if (idx < 0) return { wood: 0, stone: 0, crop: 0 };
    const ratio = troopCounts[idx] / grandTotal;
    return {
      wood: Math.floor(stash.wood * ratio),
      stone: Math.floor(stash.stone * ratio),
      crop: Math.floor(stash.crop * ratio),
    };
  }

  getVillageOverflow(villageName: string): { wood: number; stone: number; crop: number } | null {
    const share = this.getVillageResourceShare(villageName);
    const village = this.userInformationService.userInformation?.villages?.find(
      (v: any) => v.villageName === villageName
    );
    if (!village) return null;
    const levels = village.buildingsLevels;
    const freeWood = Math.max(0, (warehouseStorageByLevel[levels.woodWarehouseLevel] || 0) - village.resourcesAmounts.woodAmount);
    const freeStone = Math.max(0, (warehouseStorageByLevel[levels.stoneWarehouseLevel] || 0) - village.resourcesAmounts.stonesAmount);
    const freeCrop = Math.max(0, (warehouseStorageByLevel[levels.cropWarehouseLevel] || 0) - village.resourcesAmounts.cropAmount);
    const overflow = {
      wood: Math.max(0, share.wood - freeWood),
      stone: Math.max(0, share.stone - freeStone),
      crop: Math.max(0, share.crop - freeCrop),
    };
    return (overflow.wood > 0 || overflow.stone > 0 || overflow.crop > 0) ? overflow : null;
  }

  onRetreatClick(): void {
    if (this.retreating) return;

    if (this.hasMultipleContributions) {
      this.selectedWithdrawVillages = new Set();
      this.showWithdrawModal = true;
      return;
    }

    if (this.hasOverflow) {
      this.showRetreatConfirm = true;
    } else {
      this.confirmRetreat();
    }
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
          this.userInformationService.refreshUserInformation();
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
    this.confirmRetreat();
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
          this.userInformationService.refreshUserInformation();
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

  viewPlayer(username: string): void {
    this.router.navigate(['player', username]);
  }

  close(): void {
    this.closed.emit();
  }
}
