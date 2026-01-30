import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Village } from '../models/Village';
import { TroopsAmounts } from '../models/troopsAmounts';
import { environment } from 'src/environments/environment';

const MAX_VILLAGE_NAME_LENGTH = 20;

@Component({
  selector: 'app-right-toolbar',
  templateUrl: './right-toolbar.component.html',
  styleUrls: ['./right-toolbar.component.scss']
})
export class RightToolbarComponent implements OnInit, OnDestroy {

  constructor(
    private userInformationService: UserInformationService,
    private http: HttpClient
  ) { 

  }
  cropProduction!: number;
  woodProduction!: number;
  stoneProduction!: number;

  spearFighters!: number;
  swordFighters!: number;
  axeFighters!: number;
  archers!: number;
  magicians!: number;
  horsemen!: number;
  catapults !: number;

  // Support troops (from clan members)
  clanSpearFighters: number = 0;
  clanSwordFighters: number = 0;
  clanAxeFighters: number = 0;
  clanArchers: number = 0;
  clanMagicians: number = 0;
  clanHorsemen: number = 0;
  clanCatapults: number = 0;
  hasClan: boolean = false;

  villages: Array<string> = [];
  activeVillage: number = 0;

  // Rename village
  showRenameModal: boolean = false;
  renameVillageIndex: number = -1;
  newVillageName: string = '';
  renameError: string = '';
  renameSuccess: string = '';
  renameSaving: boolean = false;
  maxVillageNameLength = MAX_VILLAGE_NAME_LENGTH;

  subscription!: Subscription;


  ngOnInit(): void {

    this.updateVillage();

    this.villages = this.userInformationService.userInformation.villages.map((village: Village)=>{
      return village.villageName;
    });

    this.subscription = this.userInformationService.villageChanged$.subscribe(()=>{
      this.updateVillage();
      this.villages = this.userInformationService.userInformation.villages.map((village: Village)=>{
        return village.villageName;
      });
    })

  }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  updateVillage()
  {
    this.activeVillage = this.userInformationService.currentVillageIndex;

    this.cropProduction = this.userInformationService.currentVillage.cropProductionPerSecond * 3600;
    this.woodProduction = this.userInformationService.currentVillage.woodProductionPerSecond * 3600;
    this.stoneProduction =this.userInformationService.currentVillage.stoneProductionPerSecond * 3600;

    this.spearFighters = this.userInformationService.currentVillage.troops.spearFighters;
    this.swordFighters = this.userInformationService.currentVillage.troops.swordFighters;
    this.axeFighters = this.userInformationService.currentVillage.troops.axeFighters;
    this.archers = this.userInformationService.currentVillage.troops.archers;
    this.magicians = this.userInformationService.currentVillage.troops.magicians;
    this.horsemen = this.userInformationService.currentVillage.troops.horsemen;
    this.catapults = this.userInformationService.currentVillage.troops.catapults;

    // Update support troops (from clan members)
    this.hasClan = !!this.userInformationService.userInformation.clanName;
    
    const clanTroops = this.userInformationService.currentVillage.clanTroops;
    if (clanTroops) {
      this.clanSpearFighters = clanTroops.spearFighters || 0;
      this.clanSwordFighters = clanTroops.swordFighters || 0;
      this.clanAxeFighters = clanTroops.axeFighters || 0;
      this.clanArchers = clanTroops.archers || 0;
      this.clanMagicians = clanTroops.magicians || 0;
      this.clanHorsemen = clanTroops.horsemen || 0;
      this.clanCatapults = clanTroops.catapults || 0;
    } else {
      this.clanSpearFighters = 0;
      this.clanSwordFighters = 0;
      this.clanAxeFighters = 0;
      this.clanArchers = 0;
      this.clanMagicians = 0;
      this.clanHorsemen = 0;
      this.clanCatapults = 0;
    }
  }

  switchToVillage(index: number) // clicked on a differnet village
  {
    this.userInformationService.switchVillage(index);
  }

  openRenameModal(event: Event, index: number): void {
    event.stopPropagation(); // Prevent village switch
    this.renameVillageIndex = index;
    this.newVillageName = this.villages[index];
    this.renameError = '';
    this.renameSuccess = '';
    this.showRenameModal = true;
  }

  closeRenameModal(): void {
    this.showRenameModal = false;
    this.renameVillageIndex = -1;
    this.newVillageName = '';
    this.renameError = '';
    this.renameSuccess = '';
  }

  saveVillageName(): void {
    if (!this.newVillageName.trim()) {
      this.renameError = 'Village name cannot be empty';
      return;
    }

    if (this.newVillageName.length > MAX_VILLAGE_NAME_LENGTH) {
      this.renameError = `Village name cannot exceed ${MAX_VILLAGE_NAME_LENGTH} characters`;
      return;
    }

    this.renameSaving = true;
    this.renameError = '';

    this.http.post(`${environment.apiUrl}/interactions/rename-village`, {
      username: this.userInformationService.userInformation.username,
      villageIndex: this.renameVillageIndex,
      newVillageName: this.newVillageName.trim()
    }).subscribe({
      next: () => {
        this.renameSaving = false;
        this.renameSuccess = 'Village renamed successfully!';
        this.userInformationService.updateUser();
        setTimeout(() => {
          this.closeRenameModal();
        }, 1500);
      },
      error: (err) => {
        this.renameSaving = false;
        this.renameError = err.error?.message || 'Failed to rename village';
      }
    });
  }
}
