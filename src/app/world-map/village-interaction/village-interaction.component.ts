import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VillageOnMap } from '../models/mapModels';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { TroopsAmounts } from 'src/app/main-panel/models/troopsAmounts';
import { ResourcesAmounts } from 'src/app/main-panel/models/resourcesAmounts';
import { User } from 'src/app/main-panel/models/User';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-village-interaction',
  templateUrl: './village-interaction.component.html',
  styleUrls: ['./village-interaction.component.scss']
})
export class VillageInteractionComponent implements OnInit, OnDestroy {

  @Input() village!: VillageOnMap;
  @Input() currentUsername!: string;
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

  subscription?: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private userInformationService: UserInformationService
  ) { }

  ngOnInit(): void {
    this.isOwnVillage = this.village.ownerUsername === this.currentUsername;
    this.loadPlayerInfo();
    this.initMaxTroops();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  initMaxTroops(): void {
    const userTroops = this.userInformationService.currentVillage.troops;
    this.maxPossibleTroops = new TroopsAmounts(
      userTroops.spearFighters, userTroops.swordFighters, userTroops.axeFighters,
      userTroops.archers, userTroops.magicians, userTroops.horsemen, userTroops.catapults
    );
  }

  loadPlayerInfo(): void {
    this.http.get<any>(`${environment.apiUrl}/users/profile/${this.village.ownerUsername}`)
      .subscribe({
        next: (user) => {
          this.playerInfo = user;
          this.loading = false;
          // Check if same clan
          const currentClan = this.userInformationService.userInformation.clanName;
          this.isSameClan = !!(currentClan && user.clanName && currentClan === user.clanName);
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  getVillagePopulation(): number {
    if (!this.playerInfo) return 0;
    const village = this.playerInfo.villages?.find((v: any) => v.villageName === this.village.villageName);
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

  openAttackPanel(): void {
    this.showAttackPanel = true;
    this.showSupportPanel = false;
    this.showResourcesPanel = false;
  }

  openSupportPanel(): void {
    this.showSupportPanel = true;
    this.showAttackPanel = false;
    this.showResourcesPanel = false;
  }

  openResourcesPanel(): void {
    this.showResourcesPanel = true;
    this.showAttackPanel = false;
    this.showSupportPanel = false;
  }

  troopsChanged(troops: TroopsAmounts): void {
    this.chosenTroops = troops;
    this.updateMaximumPossibleTroops();
  }

  updateMaximumPossibleTroops(): void {
    const current = this.userInformationService.currentVillage.troops;
    this.maxPossibleTroops.spearFighters = current.spearFighters - this.chosenTroops.spearFighters;
    this.maxPossibleTroops.swordFighters = current.swordFighters - this.chosenTroops.swordFighters;
    this.maxPossibleTroops.axeFighters = current.axeFighters - this.chosenTroops.axeFighters;
    this.maxPossibleTroops.archers = current.archers - this.chosenTroops.archers;
    this.maxPossibleTroops.magicians = current.magicians - this.chosenTroops.magicians;
    this.maxPossibleTroops.horsemen = current.horsemen - this.chosenTroops.horsemen;
    this.maxPossibleTroops.catapults = current.catapults - this.chosenTroops.catapults;
  }

  attack(): void {
    if (!this.hasSelectedTroops()) {
      return;
    }
    this.subscription = this.http.post<User>(`${environment.apiUrl}/attack`, {
      defenderName: this.village.ownerUsername,
      attackerName: this.currentUsername,
      attackerVillageIndex: this.userInformationService.currentVillageIndex,
      defenderVillageIndex: this.getDefenderVillageIndex(),
      attackingTroops: this.chosenTroops
    }).subscribe({
      next: (user: User) => {
        this.userInformationService.setUserInformation(user);
        this.router.navigateByUrl('home');
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Attack failed';
      }
    });
  }

  hasSelectedTroops(): boolean {
    if (!this.chosenTroops) return false;
    const total = this.chosenTroops.spearFighters + this.chosenTroops.swordFighters + 
      this.chosenTroops.axeFighters + this.chosenTroops.archers + 
      this.chosenTroops.magicians + this.chosenTroops.horsemen + this.chosenTroops.catapults;
    return total > 0;
  }

  sendSupport(): void {
    if (!this.hasSelectedTroops()) {
      return;
    }
    this.subscription = this.http.post<User>(`${environment.apiUrl}/interactions/send-support`, {
      senderUsername: this.currentUsername,
      senderVillageIndex: this.userInformationService.currentVillageIndex,
      recipientUsername: this.village.ownerUsername,
      recipientVillageName: this.village.villageName,
      troops: this.chosenTroops
    }).subscribe({
      next: (user: User) => {
        this.userInformationService.setUserInformation(user);
        this.closed.emit();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to send support';
      }
    });
  }

  sendResources(): void {
    this.subscription = this.http.post<User>(`${environment.apiUrl}/interactions/send-resources`, {
      senderUsername: this.currentUsername,
      senderVillageIndex: this.userInformationService.currentVillageIndex,
      recipientUsername: this.village.ownerUsername,
      recipientVillageName: this.village.villageName,
      resources: {
        woodAmount: this.resourcesWood,
        stonesAmount: this.resourcesStones,
        cropAmount: this.resourcesCrop
      }
    }).subscribe({
      next: (user: User) => {
        this.userInformationService.setUserInformation(user);
        this.closed.emit();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to send resources';
      }
    });
  }

  getDefenderVillageIndex(): number {
    if (!this.playerInfo) return 0;
    return this.playerInfo.villages?.findIndex((v: any) => v.villageName === this.village.villageName) || 0;
  }

  close(): void {
    this.closed.emit();
  }

  getMaxWood(): number {
    return Math.floor(this.userInformationService.currentVillage.resourcesAmounts.woodAmount);
  }

  getMaxStones(): number {
    return Math.floor(this.userInformationService.currentVillage.resourcesAmounts.stonesAmount);
  }

  getMaxCrop(): number {
    return Math.floor(this.userInformationService.currentVillage.resourcesAmounts.cropAmount);
  }

  getEnergy(): number {
    return this.userInformationService.userInformation.energy;
  }
}
