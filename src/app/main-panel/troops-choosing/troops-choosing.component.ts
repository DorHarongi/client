import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { calculateTroopStats } from 'src/app/shared/troop-stats.util';
import { TroopsAmounts } from '../models/troopsAmounts';
import { spearFighterMinimumArsenalLevel, swordFighterMinimumArsenalLevel, axeFighterMinimumArsenalLevel,
  archerMinimumArsenalLevel, magicianMinimumArsenalLevel, horsemenMinimumArsenalLevel, catapultsMinimumArsenalLevel,
  spearFighterAttackingStat, spearFighterDefenceStat, swordFighterAttackingStat, swordFighterDefenceStat, axeFighterAttackingStat, axeFighterDefenceStat,
  archerAttackingStat, archerDefenceStat, magicianAttackingStat, magicianDefenceStat, horsemenAttackingStat, horsemenDefenceStat, catapultsAttackingStat,
  catapultsDefenceStat,
  spearFighterMovementSpeed, swordFighterMovementSpeed, axeFighterMovementSpeed,
  archerMovementSpeed, magicianMovementSpeed, horsemenMovementSpeed, catapultsMovementSpeed,
  calculateDistance, calculateTravelTimeMs, getArmySpeed, getSkillBonus, SkillCategory } from 'utils'

@Component({
  selector: 'app-troops-choosing',
  templateUrl: './troops-choosing.component.html',
  styleUrls: ['./troops-choosing.component.scss']
})
export class TroopsChoosingComponent implements OnInit {

  @Output() onTroopsChange = new EventEmitter<TroopsAmounts>();
  @Input() maxPossibleTroops!: TroopsAmounts;
  @Input() initialTroops?: TroopsAmounts;

  @Input() showAttack: boolean = false;
  @Input() showDefense: boolean = false;
  @Input() showETA: boolean = false;
  @Input() targetLocation?: { x: number; y: number };
  @Input() applyAttackBonus: boolean = false;
  @Input() applyDefenseBonus: boolean = false;
  @Input() attackMultiplier: number = 1;
  @Input() showBaseHints: boolean = false;

  baseAttack: number = 0;
  baseDefense: number = 0;
  effectiveAttack: number = 0;
  effectiveDefense: number = 0;
  armySpeed: number = 0;
  travelTimeMs: number = 0;

  constructor(private userInformationService: UserInformationService) { 
    this.canTrainSpearFighters = this.userInformationService.currentVillage.buildingsLevels.arsenalLevel >= spearFighterMinimumArsenalLevel;
    this.canTrainSwordFighters = this.userInformationService.currentVillage.buildingsLevels.arsenalLevel >= swordFighterMinimumArsenalLevel;
    this.canTrainAxeFighters = this.userInformationService.currentVillage.buildingsLevels.arsenalLevel >= axeFighterMinimumArsenalLevel;
    this.canTrainArchers = this.userInformationService.currentVillage.buildingsLevels.arsenalLevel >= archerMinimumArsenalLevel;
    this.canTrainMagicians = this.userInformationService.currentVillage.buildingsLevels.arsenalLevel >= magicianMinimumArsenalLevel;
    this.canTrainHorsemen = this.userInformationService.currentVillage.buildingsLevels.arsenalLevel >= horsemenMinimumArsenalLevel;
    this.canTrainCatapults = this.userInformationService.currentVillage.buildingsLevels.arsenalLevel >= catapultsMinimumArsenalLevel;
    
  }

  troops: TroopsAmounts = new TroopsAmounts(0, 0, 0, 0, 0, 0, 0);

  spearFighterAttackingStat: number = spearFighterAttackingStat;
  spearFighterDefenceStat: number = spearFighterDefenceStat;
  swordFighterAttackingStat: number = swordFighterAttackingStat;
  swordFighterDefenceStat: number = swordFighterDefenceStat;
  axeFighterAttackingStat: number = axeFighterAttackingStat;
  axeFighterDefenceStat: number = axeFighterDefenceStat;
  archerAttackingStat: number = archerAttackingStat;
  archerDefenceStat: number = archerDefenceStat;
  magicianAttackingStat: number = magicianAttackingStat;
  magicianDefenceStat: number = magicianDefenceStat;
  horsemenAttackingStat: number = horsemenAttackingStat;
  horsemenDefenceStat: number = horsemenDefenceStat;
  catapultsAttackingStat: number = catapultsAttackingStat;
  catapultsDefenceStat: number = catapultsDefenceStat;

  spearFighterMovementSpeed: number = spearFighterMovementSpeed;
  swordFighterMovementSpeed: number = swordFighterMovementSpeed;
  axeFighterMovementSpeed: number = axeFighterMovementSpeed;
  archerMovementSpeed: number = archerMovementSpeed;
  magicianMovementSpeed: number = magicianMovementSpeed;
  horsemenMovementSpeed: number = horsemenMovementSpeed;
  catapultsMovementSpeed: number = catapultsMovementSpeed;


  canTrainSpearFighters: boolean;
  canTrainSwordFighters: boolean;
  canTrainAxeFighters: boolean;
  canTrainArchers: boolean;
  canTrainMagicians: boolean;
  canTrainHorsemen: boolean;
  canTrainCatapults: boolean;

  // Snapshot of initial troops for disable logic
  private _initialTroopsSnapshot?: TroopsAmounts;

  ngOnInit(): void {
    // Capture initial troops if not explicitly provided
    if (!this.initialTroops && this.maxPossibleTroops) {
      this._initialTroopsSnapshot = new TroopsAmounts(
        this.maxPossibleTroops.spearFighters,
        this.maxPossibleTroops.swordFighters,
        this.maxPossibleTroops.axeFighters,
        this.maxPossibleTroops.archers,
        this.maxPossibleTroops.magicians,
        this.maxPossibleTroops.horsemen,
        this.maxPossibleTroops.catapults
      );
    }
  }

  // Get initial troops for disable check (village's original troops)
  getInitialTroops(): TroopsAmounts | undefined {
    return this.initialTroops || this._initialTroopsSnapshot;
  }

  // Check if troop type should be disabled (has 0 in village initially)
  isDisabled(troopType: string): boolean {
    const initial = this.getInitialTroops();
    if (!initial) return false;
    
    switch(troopType) {
      case 'spearFighters': return !this.canTrainSpearFighters || initial.spearFighters <= 0;
      case 'swordFighters': return !this.canTrainSwordFighters || initial.swordFighters <= 0;
      case 'axeFighters': return !this.canTrainAxeFighters || initial.axeFighters <= 0;
      case 'archers': return !this.canTrainArchers || initial.archers <= 0;
      case 'magicians': return !this.canTrainMagicians || initial.magicians <= 0;
      case 'horsemen': return !this.canTrainHorsemen || initial.horsemen <= 0;
      case 'catapults': return !this.canTrainCatapults || initial.catapults <= 0;
      default: return false;
    }
  }

  spearFightersInputChange(value: any)
  {
    this.troops.spearFighters = this.fixInputValue(value, this.troops.spearFighters, this.maxPossibleTroops.spearFighters);
    this.onTroopsUpdated();
  }

  swordFightersInputChange(value: any)
  {
    this.troops.swordFighters = this.fixInputValue(value, this.troops.swordFighters, this.maxPossibleTroops.swordFighters);
    this.onTroopsUpdated();
  }

  axeFightersInputChange(value: any)
  {
    this.troops.axeFighters = this.fixInputValue(value, this.troops.axeFighters, this.maxPossibleTroops.axeFighters);
    this.onTroopsUpdated();
  }

  archersInputChange(value: any)
  {
    this.troops.archers = this.fixInputValue(value, this.troops.archers, this.maxPossibleTroops.archers);
    this.onTroopsUpdated();
  }

  magiciansInputChange(value: any)
  {
    this.troops.magicians = this.fixInputValue(value, this.troops.magicians, this.maxPossibleTroops.magicians);
    this.onTroopsUpdated();
  }

  horsemenInputChange(value: any)
  {
    this.troops.horsemen = this.fixInputValue(value, this.troops.horsemen, this.maxPossibleTroops.horsemen);
    this.onTroopsUpdated();
  }
  
  catapultsInputChange(value: any)
  {
    this.troops.catapults = this.fixInputValue(value, this.troops.catapults, this.maxPossibleTroops.catapults);
    this.onTroopsUpdated();
  }
  
  fixInputValue(value: number, oldValue: number, maxValue: number): number
  {
    let freePoulation: number = maxValue + oldValue;
    if(value > freePoulation)
    {
      return 0;
    }
    return value;
  }

  maxSpearFighters()
  {
    this.troops.spearFighters += this.maxPossibleTroops.spearFighters;
    this.onTroopsUpdated();
  }

  maxSwordFighters()
  {
    this.troops.swordFighters += this.maxPossibleTroops.swordFighters;
    this.onTroopsUpdated();
  }

  maxAxeFighters()
  {
    this.troops.axeFighters += this.maxPossibleTroops.axeFighters;
    this.onTroopsUpdated();
  }

  maxArchers()
  {
    this.troops.archers += this.maxPossibleTroops.archers;
    this.onTroopsUpdated();
  }

  maxMagicians()
  {
    this.troops.magicians += this.maxPossibleTroops.magicians;
    this.onTroopsUpdated();
  }

  maxHorsemen()
  {
    this.troops.horsemen += this.maxPossibleTroops.horsemen;
    this.onTroopsUpdated();
  }

  maxCatapults()
  {
    this.troops.catapults += this.maxPossibleTroops.catapults
    this.onTroopsUpdated();
  }

  private onTroopsUpdated(): void {
    this.onTroopsChange.emit(this.troops);
    this.updateStats();
    this.updateTravelStats();
  }

  private updateStats(): void {
    if (!this.hasTroops()) {
      this.baseAttack = 0;
      this.baseDefense = 0;
      this.effectiveAttack = 0;
      this.effectiveDefense = 0;
      return;
    }
    const village = this.userInformationService.currentVillage;
    const stats = calculateTroopStats(this.troops, {
      skills: (village as any)?.skills,
      applyAttackSkillBonus: this.applyAttackBonus,
      applyDefenseSkillBonus: this.applyDefenseBonus,
      attackMultiplier: this.attackMultiplier,
    });
    this.baseAttack = stats.baseAttack;
    this.baseDefense = stats.baseDefense;
    this.effectiveAttack = stats.effectiveAttack;
    this.effectiveDefense = stats.effectiveDefense;
  }

  private updateTravelStats(): void {
    if (!this.showETA || !this.targetLocation || !this.hasTroops()) {
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

    this.armySpeed = getArmySpeed(this.troops as any);
    if (this.armySpeed <= 0) {
      this.travelTimeMs = 0;
      return;
    }

    const distance = calculateDistance(
      currentVillage.location.x, currentVillage.location.y,
      this.targetLocation.x, this.targetLocation.y
    );
    const skills = (currentVillage as any)?.skills;
    const quickStepBonus = skills ? getSkillBonus(skills, SkillCategory.QUICK_STEP) : 0;
    this.travelTimeMs = calculateTravelTimeMs(distance, this.armySpeed, quickStepBonus);
  }

  getFormattedTravelTime(): string {
    if (!this.travelTimeMs || this.travelTimeMs <= 0) return '—';
    const totalSeconds = Math.floor(this.travelTimeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  get hasAttackBonus(): boolean {
    const skills = (this.userInformationService.currentVillage as any)?.skills;
    return this.applyAttackBonus && skills ? getSkillBonus(skills, SkillCategory.SHARPER_BLADES) > 0 : false;
  }

  get hasDefenseBonus(): boolean {
    const skills = (this.userInformationService.currentVillage as any)?.skills;
    return this.applyDefenseBonus && skills ? getSkillBonus(skills, SkillCategory.HEROIC_SHIELD) > 0 : false;
  }

  get showTotalStats(): boolean {
    return (this.showAttack && this.effectiveAttack > 0) ||
           (this.showDefense && this.effectiveDefense > 0);
  }

  private hasTroops(): boolean {
    return this.troops.spearFighters > 0 || this.troops.swordFighters > 0 ||
           this.troops.axeFighters > 0 || this.troops.archers > 0 ||
           this.troops.magicians > 0 || this.troops.horsemen > 0 ||
           this.troops.catapults > 0;
  }

}
