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
} from 'utils';
import { OasisOnMap } from '../models/mapModels';

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

  showSendTroopsPanel: boolean = false;
  maxPossibleTroops!: TroopsAmounts;
  chosenTroops!: TroopsAmounts;

  totalAttack: number = 0;
  totalDefense: number = 0;
  armySpeed: number = 0;
  travelTimeMs: number = 0;

  private subscription?: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private userInformationService: UserInformationService,
  ) {}

  ngOnInit(): void {
    this.initMaxTroops();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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
    this.scouting = true;
    this.errorMessage = '';
    this.subscription = this.http
      .get<any>(`${environment.apiUrl}/oasis/info/${this.oasis.id}`)
      .subscribe({
        next: (info) => {
          this.oasisInfo = info;
          this.scouting = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to scout oasis';
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

  getLootedAmount(resource: 'wood' | 'stone' | 'crop'): number {
    if (!this.oasisInfo?.garrison?.totalForOccupier || !this.oasisInfo?.resourcesRemaining) return 0;
    return this.oasisInfo.garrison.totalForOccupier[resource] - this.oasisInfo.resourcesRemaining[resource];
  }

  getTotalForOccupier(resource: 'wood' | 'stone' | 'crop'): number {
    if (!this.oasisInfo?.garrison?.totalForOccupier) return 0;
    return this.oasisInfo.garrison.totalForOccupier[resource];
  }

  retreat(): void {
    if (this.retreating) return;
    this.retreating = true;
    this.errorMessage = '';

    const villageName = this.oasisInfo?.garrison?.villageName;
    if (!villageName) {
      this.errorMessage = 'Could not determine garrison village.';
      this.retreating = false;
      return;
    }

    this.subscription = this.http
      .post<any>(`${environment.apiUrl}/oasis/retreat`, {
        villageName,
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
      case 'Uncommon': return 'rarity-uncommon';
      case 'Rare': return 'rarity-rare';
      case 'Very Rare': return 'rarity-very-rare';
      default: return '';
    }
  }

  close(): void {
    this.closed.emit();
  }
}
