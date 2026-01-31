import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { BossOnMap } from '../models/mapModels';
import { BossService, BossAttackResult, TroopsAmounts } from '../services/boss.service';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { ResourcesDisplayAmounts } from 'src/app/main-panel/resources-amount/resources-amount.component';
import { bossImages, bossRewardAmounts, getDistanceBonusText } from 'utils';

@Component({
  selector: 'app-boss-interaction',
  templateUrl: './boss-interaction.component.html',
  styleUrls: ['./boss-interaction.component.scss']
})
export class BossInteractionComponent implements OnInit, OnDestroy {

  @Input() boss!: BossOnMap;
  @Input() currentUsername!: string;
  @Input() currentUserClan!: string;
  @Output() closed: EventEmitter<void> = new EventEmitter<void>();
  @Output() bossDefeated: EventEmitter<void> = new EventEmitter<void>();

  showAttackPanel: boolean = false;
  maxPossibleTroops!: TroopsAmounts;
  chosenTroops!: TroopsAmounts;
  
  distance: number = 0;
  damageMultiplier: number = 1;
  distanceBonusText: string = '';
  
  errorMessage: string = '';
  loading: boolean = false;
  
  // Attack result
  attackResult: BossAttackResult | null = null;

  subscription?: Subscription;

  constructor(
    private bossService: BossService,
    private userInformationService: UserInformationService
  ) { }

  ngOnInit(): void {
    this.initMaxTroops();
    this.calculateDistance();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  initMaxTroops(): void {
    const userTroops = this.userInformationService.currentVillage.troops;
    this.maxPossibleTroops = {
      spearFighters: userTroops.spearFighters,
      swordFighters: userTroops.swordFighters,
      axeFighters: userTroops.axeFighters,
      archers: userTroops.archers,
      magicians: userTroops.magicians,
      horsemen: userTroops.horsemen,
      catapults: userTroops.catapults
    };
  }

  calculateDistance(): void {
    const village = this.userInformationService.currentVillage;
    this.distance = this.bossService.calculateDistance(
      village.location.x, village.location.y,
      this.boss.x, this.boss.y
    );
    this.damageMultiplier = this.bossService.getDistanceMultiplier(this.distance);
    this.distanceBonusText = getDistanceBonusText(this.distance);
  }

  getBossImagePath(): string {
    return `assets/${bossImages[this.boss.tier]}`;
  }

  getHpPercentage(): number {
    return (this.boss.currentHp / this.boss.maxHp) * 100;
  }

  getHpBarClass(): string {
    const percentage = this.getHpPercentage();
    if (percentage > 50) return 'hp-high';
    if (percentage > 25) return 'hp-medium';
    return 'hp-low';
  }

  formatHp(hp: number): string {
    return this.bossService.formatHp(hp);
  }

  getRewardText(): string {
    const amount = bossRewardAmounts[this.boss.tier];
    return `${amount.toLocaleString()} of each resource`;
  }

  getRewardAmount(): number {
    return bossRewardAmounts[this.boss.tier];
  }

  getRewardResources(): ResourcesDisplayAmounts {
    const amount = bossRewardAmounts[this.boss.tier];
    return { crop: amount, wood: amount, stone: amount };
  }

  getReceivedRewards(): ResourcesDisplayAmounts {
    if (!this.attackResult?.rewards) {
      return { crop: 0, wood: 0, stone: 0 };
    }
    return {
      crop: this.attackResult.rewards.crop,
      wood: this.attackResult.rewards.wood,
      stone: this.attackResult.rewards.stone
    };
  }

  isClaimedByMyClan(): boolean {
    return this.boss.claimedByClanName === this.currentUserClan && !!this.currentUserClan;
  }

  isClaimedByOtherClan(): boolean {
    return !!this.boss.claimedByClanName && !this.isClaimedByMyClan();
  }

  canAttack(): boolean {
    // Must be in a clan
    if (!this.currentUserClan) return false;
    // Either not claimed or claimed by my clan
    return !this.boss.claimedByClanName || this.isClaimedByMyClan();
  }

  getTimeRemaining(): string {
    if (!this.boss.expiresAt) return '';
    const now = new Date();
    const expires = new Date(this.boss.expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  }

  openAttackPanel(): void {
    this.showAttackPanel = true;
    this.errorMessage = '';
  }

  troopsChanged(troops: TroopsAmounts): void {
    this.chosenTroops = troops;
    this.updateMaximumPossibleTroops();
  }

  updateMaximumPossibleTroops(): void {
    const current = this.userInformationService.currentVillage.troops;
    this.maxPossibleTroops = {
      spearFighters: current.spearFighters - (this.chosenTroops?.spearFighters || 0),
      swordFighters: current.swordFighters - (this.chosenTroops?.swordFighters || 0),
      axeFighters: current.axeFighters - (this.chosenTroops?.axeFighters || 0),
      archers: current.archers - (this.chosenTroops?.archers || 0),
      magicians: current.magicians - (this.chosenTroops?.magicians || 0),
      horsemen: current.horsemen - (this.chosenTroops?.horsemen || 0),
      catapults: current.catapults - (this.chosenTroops?.catapults || 0)
    };
  }

  hasSelectedTroops(): boolean {
    if (!this.chosenTroops) return false;
    const total = (this.chosenTroops.spearFighters || 0) + (this.chosenTroops.swordFighters || 0) + 
      (this.chosenTroops.axeFighters || 0) + (this.chosenTroops.archers || 0) + 
      (this.chosenTroops.magicians || 0) + (this.chosenTroops.horsemen || 0) + 
      (this.chosenTroops.catapults || 0);
    return total > 0;
  }

  getEnergy(): number {
    return this.userInformationService.userInformation.energy;
  }

  attack(): void {
    if (!this.hasSelectedTroops()) return;
    if (this.getEnergy() < 1) {
      this.errorMessage = 'Not enough energy';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.subscription = this.bossService.attackBoss(this.currentUsername, {
      bossId: this.boss.id,
      villageName: this.userInformationService.currentVillage.villageName,
      troops: this.chosenTroops
    }).subscribe({
      next: (result: BossAttackResult) => {
        this.loading = false;
        this.attackResult = result;
        this.showAttackPanel = false;
        
        // Update user info from backend
        this.userInformationService.refreshUserInformation();

        // Update boss HP locally (whether defeated or not)
        this.boss.currentHp = result.report.bossHpAfter;
        
        if (result.bossDefeated) {
          // Boss was defeated - don't auto-close, let user view the results
          // The bossDefeated event will be emitted when user clicks Close
        }
      },
      error: (err) => {
        this.loading = false;
        const errorMsg = err.error?.message || 'Attack failed';
        this.errorMessage = errorMsg;
        
        // If boss was defeated by someone else, update HP to 0 and show that
        if (errorMsg.toLowerCase().includes('already defeated') || errorMsg.toLowerCase().includes('not found')) {
          this.boss.currentHp = 0;
        }
      }
    });
  }

  hasAnyLosses(): boolean {
    if (!this.attackResult) return false;
    const losses = this.attackResult.report.attackerLostTroops;
    return (losses.spearFighters || 0) > 0 || (losses.swordFighters || 0) > 0 ||
      (losses.axeFighters || 0) > 0 || (losses.archers || 0) > 0 ||
      (losses.magicians || 0) > 0 || (losses.horsemen || 0) > 0 ||
      (losses.catapults || 0) > 0;
  }

  close(): void {
    // If boss was defeated, emit bossDefeated to trigger map reload
    if (this.attackResult?.bossDefeated) {
      this.bossDefeated.emit();
    }
    this.closed.emit();
  }
}
