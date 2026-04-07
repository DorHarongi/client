import { Component, ElementRef, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Village } from '../models/Village';
import { TroopsAmounts } from '../models/troopsAmounts';
import { environment } from 'src/environments/environment';
import {
  spearFighterAttackingStat, swordFighterAttackingStat, axeFighterAttackingStat, archerAttackingStat,
  magicianAttackingStat, horsemenAttackingStat, catapultsAttackingStat,
  spearFighterDefenceStat, swordFighterDefenceStat, axeFighterDefenceStat, archerDefenceStat,
  magicianDefenceStat, horsemenDefenceStat, catapultsDefenceStat,
  getSkillBonus, SkillCategory,
  getRelicAttackBonus, getRelicDefenseBonus, getRelicProductionBonus,
  getEffectiveAttackMultiplier, getEffectiveDefenseMultiplier,
} from 'utils';

const MAX_VILLAGE_NAME_LENGTH = 20;

@Component({
  selector: 'app-right-toolbar',
  templateUrl: './right-toolbar.component.html',
  styleUrls: ['./right-toolbar.component.scss']
})
export class RightToolbarComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly MAX_COLUMNS = 7;
  private resizeObserver?: ResizeObserver;
  private rafId = 0;

  constructor(
    private userInformationService: UserInformationService,
    private http: HttpClient,
    private el: ElementRef
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

  totalAttack: number = 0;
  totalDefense: number = 0;
  sharperBladesBonus: number = 0;
  heroicShieldBonus: number = 0;
  goldRushBonus: number = 0;
  relicAttackBonus: number = 0;
  relicDefenseBonus: number = 0;
  relicProductionBonus: number = 0;
  baseAttack: number = 0;
  baseDefense: number = 0;
  get sharperBladesPercent(): string { return (this.sharperBladesBonus * 100).toFixed(0); }
  get heroicShieldPercent(): string { return (this.heroicShieldBonus * 100).toFixed(0); }
  get goldRushPercent(): string { return (this.goldRushBonus * 100).toFixed(0); }
  get relicAttackPercent(): string { return (this.relicAttackBonus * 100).toFixed(0); }
  get relicDefensePercent(): string { return (this.relicDefenseBonus * 100).toFixed(0); }
  get relicProductionPercent(): string { return (this.relicProductionBonus * 100).toFixed(0); }

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

  ngAfterViewInit(): void {
    this.scheduleColumnUpdate();

    const toolbar = this.el.nativeElement.querySelector('.toolbarContainer');
    if (toolbar) {
      this.resizeObserver = new ResizeObserver(() => this.scheduleColumnUpdate());
      this.resizeObserver.observe(toolbar);
    }
  }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.rafId);
  }

  private scheduleColumnUpdate(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.updateColumns());
  }

  private updateColumns(): void {
    const toolbar = this.el.nativeElement.querySelector('.toolbarContainer');
    if (!toolbar || window.innerWidth <= 1200) return;

    toolbar.removeAttribute('data-columns');
    toolbar.style.overflowY = '';
    void toolbar.offsetHeight;

    if (toolbar.scrollHeight <= toolbar.clientHeight + 1) return;

    for (let cols = 2; cols <= RightToolbarComponent.MAX_COLUMNS; cols++) {
      toolbar.setAttribute('data-columns', cols.toString());
      void toolbar.offsetHeight;
      if (toolbar.scrollHeight <= toolbar.clientHeight + 1) return;
    }

    toolbar.style.overflowY = 'auto';
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

    const v = this.userInformationService.currentVillage;
    const troops = v.troops;
    const support = v.clanTroops || { spearFighters: 0, swordFighters: 0, axeFighters: 0, archers: 0, magicians: 0, horsemen: 0, catapults: 0 };
    const baseAttack =
      troops.spearFighters * spearFighterAttackingStat +
      troops.swordFighters * swordFighterAttackingStat +
      troops.axeFighters * axeFighterAttackingStat +
      troops.archers * archerAttackingStat +
      troops.magicians * magicianAttackingStat +
      troops.horsemen * horsemenAttackingStat +
      troops.catapults * catapultsAttackingStat;
    const baseDefense =
      (troops.spearFighters + support.spearFighters) * spearFighterDefenceStat +
      (troops.swordFighters + support.swordFighters) * swordFighterDefenceStat +
      (troops.axeFighters + support.axeFighters) * axeFighterDefenceStat +
      (troops.archers + support.archers) * archerDefenceStat +
      (troops.magicians + support.magicians) * magicianDefenceStat +
      (troops.horsemen + support.horsemen) * horsemenDefenceStat +
      (troops.catapults + support.catapults) * catapultsDefenceStat;
    this.baseAttack = baseAttack;
    this.baseDefense = baseDefense;
    this.sharperBladesBonus = getSkillBonus(v.skills, SkillCategory.SHARPER_BLADES);
    this.heroicShieldBonus = getSkillBonus(v.skills, SkillCategory.HEROIC_SHIELD);
    this.goldRushBonus = getSkillBonus(v.skills, SkillCategory.GOLD_RUSH);
    const heldRelics = v.heldRelicIds || [];
    this.relicAttackBonus = getRelicAttackBonus(heldRelics);
    this.relicDefenseBonus = getRelicDefenseBonus(heldRelics);
    this.relicProductionBonus = getRelicProductionBonus(heldRelics);
    this.totalAttack = Math.floor(baseAttack * getEffectiveAttackMultiplier(v.skills, heldRelics));
    this.totalDefense = Math.floor(baseDefense * getEffectiveDefenseMultiplier(v.skills, heldRelics));
    this.scheduleColumnUpdate();
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
