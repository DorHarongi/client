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
import { Subscription, Subject, takeUntil } from 'rxjs';
import { TroopsAmounts } from 'src/app/main-panel/models/troopsAmounts';
import { User } from 'src/app/main-panel/models/User';
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
} from 'utils';
import { VillageOnMap } from '../models/mapModels';

@Component({
  selector: 'app-village-interaction',
  templateUrl: './village-interaction.component.html',
  styleUrls: ['./village-interaction.component.scss'],
})
export class VillageInteractionComponent implements OnInit, OnDestroy {
  @Input() village!: VillageOnMap;
  @Input() currentUsername!: string;
  @Input() hideProfileButton: boolean = false;
  @Output() closed: EventEmitter<any> = new EventEmitter<any>();

  playerInfo: any;
  loading: boolean = true;
  isSameClan: boolean = false;
  isOwnVillage: boolean = false;

  showAttackPanel: boolean = false;
  showSupportPanel: boolean = false;
  showResourcesPanel: boolean = false;

  maxPossibleTroops!: TroopsAmounts;
  chosenTroops!: TroopsAmounts;

  resourcesWood: number = 0;
  resourcesStones: number = 0;
  resourcesCrop: number = 0;

  errorMessage: string = '';

  // Troop stats
  totalAttack: number = 0;
  totalDefense: number = 0;

  // Travel stats
  armySpeed: number = 0;
  travelTimeMs: number = 0;

  subscription?: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private userInformationService: UserInformationService,
  ) {}

  ngOnInit(): void {
    this.isOwnVillage = this.village.ownerUsername === this.currentUsername;
    this.loadPlayerInfo();
    this.initMaxTroops();

    this.userInformationService.villageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initMaxTroops());

    this.userInformationService.refreshUserInformation();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
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
      userTroops.catapults
    );
  }

  loadPlayerInfo(): void {
    this.http
      .get<any>(
        `${environment.apiUrl}/users/profile/${this.village.ownerUsername}`
      )
      .subscribe({
        next: (user) => {
          this.playerInfo = user;
          this.loading = false;
          // Check if same clan
          const currentClan =
            this.userInformationService.userInformation.clanName;
          this.isSameClan = !!(
            currentClan &&
            user.clanName &&
            currentClan === user.clanName
          );
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  getVillagePopulation(): number {
    if (!this.playerInfo) return 0;
    const village = this.playerInfo.villages?.find(
      (v: any) => v.villageName === this.village.villageName
    );
    return village?.population || 0;
  }

  viewPlayerProfile(): void {
    this.router.navigate(['player', this.village.ownerUsername]);
  }

  viewPlayerClan(): void {
    if (this.playerInfo?.clanName) {
      this.router.navigate(['clan', this.playerInfo.clanName]);
    }
  }

  findOnMap(): void {
    this.router.navigate(['Map'], {
      queryParams: { x: this.village.x, y: this.village.y },
    });
  }

  openAttackPanel(): void {
    this.showAttackPanel = true;
    this.showSupportPanel = false;
    this.showResourcesPanel = false;
    this.updateTravelStats();
  }

  openSupportPanel(): void {
    this.showSupportPanel = true;
    this.showAttackPanel = false;
    this.showResourcesPanel = false;
    this.updateTravelStats();
  }

  openResourcesPanel(): void {
    this.showResourcesPanel = true;
    this.showAttackPanel = false;
    this.showSupportPanel = false;
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
      this.village.x,
      this.village.y
    );

    const skills = (currentVillage as any)?.skills;
    const quickStepBonus = skills
      ? getSkillBonus(skills, SkillCategory.QUICK_STEP)
      : 0;
    this.travelTimeMs = calculateTravelTimeMs(
      distance,
      this.armySpeed,
      quickStepBonus
    );
  }

  /** Attack with Sharper Blades bonus (for display in attack confirmation). */
  get displayAttack(): number {
    const village = this.userInformationService.currentVillage;
    const skills = (village as any)?.skills;
    const bonus = skills
      ? getSkillBonus(skills, SkillCategory.SHARPER_BLADES)
      : 0;
    return Math.floor(this.totalAttack * (1 + bonus));
  }

  /** Defense with Heroic Shield bonus (for display in attack confirmation). */
  get displayDefense(): number {
    const village = this.userInformationService.currentVillage;
    const skills = (village as any)?.skills;
    const bonus = skills
      ? getSkillBonus(skills, SkillCategory.HEROIC_SHIELD)
      : 0;
    return Math.floor(this.totalDefense * (1 + bonus));
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

  attack(): void {
    if (!this.hasSelectedTroops()) {
      return;
    }
    this.subscription = this.http
      .post<User>(`${environment.apiUrl}/attack`, {
        defenderName: this.village.ownerUsername,
        attackerName: this.currentUsername,
        attackerVillageIndex: this.userInformationService.currentVillageIndex,
        defenderVillageIndex: this.getDefenderVillageIndex(),
        attackingTroops: this.chosenTroops,
      })
      .subscribe({
        next: (user: User) => {
          this.userInformationService.setUserInformation(user);
          this.closed.emit();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Attack failed';
          this.userInformationService.refreshUserInformation();
        },
      });
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

  hasSelectedResources(): boolean {
    return (
      this.resourcesWood > 0 ||
      this.resourcesStones > 0 ||
      this.resourcesCrop > 0
    );
  }

  cancelPanel(): void {
    this.showAttackPanel = false;
    this.showSupportPanel = false;
    this.showResourcesPanel = false;
    this.errorMessage = '';
  }

  sendSupport(): void {
    if (!this.hasSelectedTroops()) {
      return;
    }
    this.subscription = this.http
      .post<User>(`${environment.apiUrl}/interactions/send-support`, {
        senderUsername: this.currentUsername,
        senderVillageIndex: this.userInformationService.currentVillageIndex,
        recipientUsername: this.village.ownerUsername,
        recipientVillageName: this.village.villageName,
        troops: this.chosenTroops,
      })
      .subscribe({
        next: (user: User) => {
          this.userInformationService.setUserInformation(user);
          this.closed.emit();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to send support';
          this.userInformationService.refreshUserInformation();
        },
      });
  }

  sendResources(): void {
    // Validate non-negative amounts
    if (
      this.resourcesWood < 0 ||
      this.resourcesStones < 0 ||
      this.resourcesCrop < 0
    ) {
      this.errorMessage = 'Resource amounts cannot be negative';
      return;
    }

    this.subscription = this.http
      .post<User>(`${environment.apiUrl}/interactions/send-resources`, {
        senderUsername: this.currentUsername,
        senderVillageIndex: this.userInformationService.currentVillageIndex,
        recipientUsername: this.village.ownerUsername,
        recipientVillageName: this.village.villageName,
        resources: {
          woodAmount: Math.max(0, this.resourcesWood),
          stonesAmount: Math.max(0, this.resourcesStones),
          cropAmount: Math.max(0, this.resourcesCrop),
        },
      })
      .subscribe({
        next: (user: User) => {
          this.userInformationService.setUserInformation(user);
          this.closed.emit();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to send resources';
          this.userInformationService.refreshUserInformation();
        },
      });
  }

  getDefenderVillageIndex(): number {
    if (!this.playerInfo?.villages) return 0;
    const idx = this.playerInfo.villages.findIndex(
      (v: any) => v.villageName === this.village.villageName
    );
    return idx >= 0 ? idx : 0;
  }

  close(): void {
    this.closed.emit();
  }

  getMaxWood(): number {
    return Math.floor(
      this.userInformationService.currentVillage.resourcesAmounts.woodAmount
    );
  }

  getMaxStones(): number {
    return Math.floor(
      this.userInformationService.currentVillage.resourcesAmounts.stonesAmount
    );
  }

  getMaxCrop(): number {
    return Math.floor(
      this.userInformationService.currentVillage.resourcesAmounts.cropAmount
    );
  }

  getEnergy(): number {
    return this.userInformationService.userInformation.energy;
  }

  hasBeginnerShield(): boolean {
    return this.playerInfo?.beginnerShieldRemainingHours > 0;
  }

  formatShieldTime(): string {
    const totalHours = this.playerInfo?.beginnerShieldRemainingHours || 0;
    const h = Math.floor(totalHours);
    const m = Math.ceil((totalHours - h) * 60);
    if (h <= 0) return `${m} minutes`;
    if (m <= 0) return `${h} hours`;
    return `${h} hours ${m} minutes`;
  }

  sendSpy(): void {
    if (this.isOwnVillage || this.isSameClan) {
      return;
    }
    this.errorMessage = '';
    const attackerVillageName =
      this.userInformationService.currentVillage?.villageName;
    if (!attackerVillageName) {
      this.errorMessage = 'Could not determine your current village.';
      return;
    }
    this.subscription = this.http
      .post<{ success: boolean; travelTimeMs: number }>(
        `${environment.apiUrl}/scouting/scout`,
        {
          attackerVillageName,
          defenderUsername: this.village.ownerUsername,
          defenderVillageName: this.village.villageName,
        }
      )
      .subscribe({
        next: () => {
          if (this.userInformationService.currentVillage) {
            this.userInformationService.currentVillage.aliveSpies = Math.max(
              0,
              (this.userInformationService.currentVillage.aliveSpies || 0) - 1
            );
            this.userInformationService.notifyVillageChanged();
          }
          this.closed.emit();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to send spies';
        },
      });
  }

}
