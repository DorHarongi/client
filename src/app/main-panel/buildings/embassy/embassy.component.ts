import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { embassyUpgradeMaterialCostByLevels, embassyMaximumDefenseTroopsByLevels, embassyMinimumLevelForClanJoin } from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
import { TroopsAmounts } from '../../models/troopsAmounts';
import { SupportSentEntry } from '../../models/SupportSent';
import { User } from '../../models/User';

@Component({
  selector: 'app-embassy',
  templateUrl: './embassy.component.html',
  styleUrls: ['./embassy.component.scss']
})
export class EmbassyComponent implements OnInit, OnDestroy {

  buildingInformation: Building;
  currentMaximumDefenceTroops: number;
  nextLevelMaximumDefenceTroops: number;
  embassyMinimumLevelForClanJoin: number;

  // Support sent tracking
  supportSent: SupportSentEntry[] = [];
  showWithdrawPanel: boolean = false;
  selectedSupport: SupportSentEntry | null = null;
  withdrawTroops!: TroopsAmounts;
  maxWithdrawTroops!: TroopsAmounts;
  subscription?: Subscription;

  constructor(
    private userInformationService: UserInformationService,
    private http: HttpClient,
    private router: Router
  ) { 
    this.buildingInformation = new Building("embassy", "Embassy", this.userInformationService.currentVillage.buildingsLevels.embassyLevel, 
    "The embassy is where support troops of your clan live. The higher level your embassy is, the more troops it can store.",
    embassyUpgradeMaterialCostByLevels[this.userInformationService.currentVillage.buildingsLevels.embassyLevel + 1]);

    this.currentMaximumDefenceTroops = embassyMaximumDefenseTroopsByLevels[this.userInformationService.currentVillage.buildingsLevels.embassyLevel];
    this.nextLevelMaximumDefenceTroops = embassyMaximumDefenseTroopsByLevels[this.userInformationService.currentVillage.buildingsLevels.embassyLevel + 1];
    this.embassyMinimumLevelForClanJoin = embassyMinimumLevelForClanJoin;
    
    this.loadSupportSent();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadSupportSent(): void {
    this.supportSent = this.userInformationService.currentVillage.supportSent || [];
  }

  hasSupportSent(): boolean {
    return this.supportSent.length > 0;
  }

  openWithdrawPanel(support: SupportSentEntry): void {
    this.selectedSupport = support;
    this.maxWithdrawTroops = new TroopsAmounts(
      support.troops.spearFighters,
      support.troops.swordFighters,
      support.troops.axeFighters,
      support.troops.archers,
      support.troops.magicians,
      support.troops.horsemen,
      support.troops.catapults
    );
    this.withdrawTroops = new TroopsAmounts(0, 0, 0, 0, 0, 0, 0);
    this.showWithdrawPanel = true;
  }

  closeWithdrawPanel(): void {
    this.showWithdrawPanel = false;
    this.selectedSupport = null;
  }

  troopsChanged(troops: TroopsAmounts): void {
    this.withdrawTroops = troops;
    // Update max for display
    if (this.selectedSupport) {
      this.maxWithdrawTroops.spearFighters = this.selectedSupport.troops.spearFighters - troops.spearFighters;
      this.maxWithdrawTroops.swordFighters = this.selectedSupport.troops.swordFighters - troops.swordFighters;
      this.maxWithdrawTroops.axeFighters = this.selectedSupport.troops.axeFighters - troops.axeFighters;
      this.maxWithdrawTroops.archers = this.selectedSupport.troops.archers - troops.archers;
      this.maxWithdrawTroops.magicians = this.selectedSupport.troops.magicians - troops.magicians;
      this.maxWithdrawTroops.horsemen = this.selectedSupport.troops.horsemen - troops.horsemen;
      this.maxWithdrawTroops.catapults = this.selectedSupport.troops.catapults - troops.catapults;
    }
  }

  withdrawSupport(): void {
    if (!this.selectedSupport || !this.withdrawTroops) return;

    this.subscription = this.http.post<User>('http://localhost:3000/interactions/withdraw-support', {
      ownerUsername: this.userInformationService.userInformation.username,
      ownerVillageIndex: this.userInformationService.currentVillageIndex,
      recipientUsername: this.selectedSupport.recipientUsername,
      recipientVillageName: this.selectedSupport.recipientVillageName,
      troops: this.withdrawTroops
    }).subscribe({
      next: (user: User) => {
        this.userInformationService.setUserInformation(user);
        this.loadSupportSent();
        this.closeWithdrawPanel();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to withdraw support');
      }
    });
  }

  getTotalTroops(troops: TroopsAmounts): number {
    return troops.spearFighters + troops.swordFighters + troops.axeFighters + 
           troops.archers + troops.magicians + troops.horsemen + troops.catapults;
  }
}
