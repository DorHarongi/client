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
import { ResourcesDisplayAmounts } from 'src/app/main-panel/resources-amount/resources-amount.component';
import { calculateTroopStats } from 'src/app/shared/troop-stats.util';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import {
  bossImages,
  bossRewardAmounts,
  calculateDistance,
  calculateTravelTimeMs,
  getArmySpeed,
  getDistanceBonusText,
  RELIC_NAMES,
} from 'utils';
import { BossOnMap } from '../models/mapModels';
import { BossService, TroopsAmounts } from '../services/boss.service';

@Component({
  selector: 'app-boss-interaction',
  templateUrl: './boss-interaction.component.html',
  styleUrls: ['./boss-interaction.component.scss'],
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

  // Damage leaderboard
  showLeaderboard: boolean = false;
  showInfo: boolean = false;
  damageLeaderboard: {
    clanName: string;
    totalDamage: number;
    players: { username: string; damage: number }[];
  }[] = [];

  // Troop stats
  baseAttack: number = 0;
  baseDefense: number = 0;
  effectiveAttack: number = 0;
  effectiveDefense: number = 0;

  // Travel stats
  armySpeed: number = 0;
  travelTimeMs: number = 0;

  // Clan claim info
  clanClaims: number = 0;
  maxClaims: number = 0;

  subscription?: Subscription;

  constructor(
    private bossService: BossService,
    private userInformationService: UserInformationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initMaxTroops();
    this.calculateDistance();
    this.loadClanClaimInfo();
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
      catapults: userTroops.catapults,
    };
  }

  calculateDistance(): void {
    const village = this.userInformationService.currentVillage;
    this.distance = this.bossService.calculateDistance(
      village.location.x,
      village.location.y,
      this.boss.x,
      this.boss.y
    );
    this.damageMultiplier = this.bossService.getDistanceMultiplier(
      this.distance
    );
    this.distanceBonusText = getDistanceBonusText(this.distance);
  }

  loadClanClaimInfo(): void {
    if (!this.currentUserClan || this.isMythicBoss()) return;
    this.bossService.getClanClaimInfo(this.currentUsername).subscribe({
      next: (info) => {
        this.clanClaims = info.clanClaims;
        this.maxClaims = info.maxClaims;
      },
      error: () => {},
    });
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

  /** Mythic boss relic name - from backend or client-side lookup by relicId */
  getMythicRewardName(): string | null {
    if (this.boss.tier !== 'mythic') return null;
    if (this.boss.relicName) return this.boss.relicName;
    if (this.boss.relicId) {
      const def = RELIC_NAMES.find((r) => r.id === this.boss.relicId);
      return def?.name ?? this.boss.relicId;
    }
    return null;
  }

  getReceivedRewards(): ResourcesDisplayAmounts {
    return { crop: 0, wood: 0, stone: 0 };
  }

  isClaimedByMyClan(): boolean {
    return (
      this.boss.claimedByClanName === this.currentUserClan &&
      !!this.currentUserClan
    );
  }

  isClaimedByOtherClan(): boolean {
    return !!this.boss.claimedByClanName && !this.isClaimedByMyClan();
  }

  canAttack(): boolean {
    // Must be in a clan
    if (!this.currentUserClan) return false;
    // Mythic: no claiming, always attackable
    if (this.boss.tier === 'mythic') return true;
    // Normal bosses: either not claimed or claimed by my clan
    return !this.boss.claimedByClanName || this.isClaimedByMyClan();
  }

  getTimeRemaining(): string {
    if (this.isMythicBoss()) return '';
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
    this.updateTotalStats();
    this.updateTravelStats();
  }

  updateTotalStats(): void {
    if (!this.chosenTroops) {
      this.baseAttack = 0;
      this.baseDefense = 0;
      this.effectiveAttack = 0;
      this.effectiveDefense = 0;
      return;
    }
    const village = this.userInformationService.currentVillage;

    const stats = calculateTroopStats(this.chosenTroops, {
      skills: (village as any)?.skills,
      applyAttackSkillBonus: true,
      applyDefenseSkillBonus: true,
      attackMultiplier: this.damageMultiplier,
    });
    this.baseAttack = stats.baseAttack;
    this.baseDefense = stats.baseDefense;
    this.effectiveAttack = stats.effectiveAttack;
    this.effectiveDefense = stats.effectiveDefense;
  }

  updateTravelStats(): void {
    if (!this.chosenTroops) {
      this.armySpeed = 0;
      this.travelTimeMs = 0;
      return;
    }

    const village = this.userInformationService.currentVillage;
    if (!village?.location) {
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
      village.location.x,
      village.location.y,
      this.boss.x,
      this.boss.y
    );
    const quickStepBonus = 0; // Skill integration will apply later
    this.travelTimeMs = calculateTravelTimeMs(
      distance,
      this.armySpeed,
      quickStepBonus
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
    this.maxPossibleTroops = {
      spearFighters:
        current.spearFighters - (this.chosenTroops?.spearFighters || 0),
      swordFighters:
        current.swordFighters - (this.chosenTroops?.swordFighters || 0),
      axeFighters: current.axeFighters - (this.chosenTroops?.axeFighters || 0),
      archers: current.archers - (this.chosenTroops?.archers || 0),
      magicians: current.magicians - (this.chosenTroops?.magicians || 0),
      horsemen: current.horsemen - (this.chosenTroops?.horsemen || 0),
      catapults: current.catapults - (this.chosenTroops?.catapults || 0),
    };
  }

  hasSelectedTroops(): boolean {
    if (!this.chosenTroops) return false;
    const total =
      (this.chosenTroops.spearFighters || 0) +
      (this.chosenTroops.swordFighters || 0) +
      (this.chosenTroops.axeFighters || 0) +
      (this.chosenTroops.archers || 0) +
      (this.chosenTroops.magicians || 0) +
      (this.chosenTroops.horsemen || 0) +
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

    this.subscription = this.bossService
      .attackBoss(this.currentUsername, {
        bossId: this.boss.id,
        villageName: this.userInformationService.currentVillage.villageName,
        troops: this.chosenTroops,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.userInformationService.refreshUserInformation();
          this.closed.emit();
        },
        error: (err) => {
          this.loading = false;
          const errorMsg = err.error?.message || 'Attack failed';
          this.errorMessage = errorMsg;

          if (
            errorMsg.toLowerCase().includes('already defeated') ||
            errorMsg.toLowerCase().includes('not found')
          ) {
            this.boss.currentHp = 0;
          }
        },
      });
  }


  toggleLeaderboard(): void {
    if (this.showLeaderboard) {
      this.showLeaderboard = false;
      return;
    }
    this.bossService.getBossDamageLeaderboard(this.boss.id).subscribe({
      next: (data) => {
        this.damageLeaderboard = data;
        this.showLeaderboard = true;
      },
      error: () => {
        this.damageLeaderboard = [];
        this.showLeaderboard = true;
      },
    });
  }

  isMythicBoss(): boolean {
    return this.boss.tier === ('mythic' as any);
  }

  getInfoTitle(): string {
    return this.isMythicBoss() ? 'Ancient Titan' : 'Raid Boss';
  }

  getInfoLines(): string[] {
    if (this.isMythicBoss()) {
      return [
        'This is an Ancient Titan — an extremely powerful mythic boss. All clans, ready yourselves for battle — you will need to give everything you have got to bring it down.',
        'Each Ancient Titan guards a unique Divine Relic. The clan that deals the most total damage will claim the relic once the titan falls.',
        'Relics can be stolen by defeating the village where the relic is being kept, so protect it carefully and entrust it only to the most loyal member of your clan.',
        'The first clan to collect all 5 Divine Relics will achieve ultimate victory and win the game.',
      ];
    }
    return [
      'Raid Bosses appear across the map and are claimed by the first clan to attack them.',
      'Once claimed, only members of that clan can continue attacking the boss.',
      'Defeat the boss before it disappears to earn a generous resource reward for every member of your clan.',
      'The closer you are to the boss, the more damage your troops will deal. Higher rarity bosses have more HP and deal more damage back to your troops.',
    ];
  }

  viewClan(clanName: string): void {
    this.router.navigate(['clan', clanName]);
  }

  close(): void {
    this.closed.emit();
  }
}
