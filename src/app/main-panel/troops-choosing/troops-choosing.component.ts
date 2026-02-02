import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { TroopsAmounts } from '../models/troopsAmounts';
import { spearFighterMinimumArsenalLevel, swordFighterMinimumArsenalLevel, axeFighterMinimumArsenalLevel,
  archerMinimumArsenalLevel, magicianMinimumArsenalLevel, horsemenMinimumArsenalLevel, catapultsMinimumArsenalLevel,
  spearFighterAttackingStat, spearFighterDefenceStat, swordFighterAttackingStat, swordFighterDefenceStat, axeFighterAttackingStat, axeFighterDefenceStat,
  archerAttackingStat, archerDefenceStat, magicianAttackingStat, magicianDefenceStat, horsemenAttackingStat, horsemenDefenceStat, catapultsAttackingStat, 
  catapultsDefenceStat } from 'utils'

@Component({
  selector: 'app-troops-choosing',
  templateUrl: './troops-choosing.component.html',
  styleUrls: ['./troops-choosing.component.scss']
})
export class TroopsChoosingComponent implements OnInit {

  @Output() onTroopsChange = new EventEmitter<TroopsAmounts>();
  @Input() maxPossibleTroops!: TroopsAmounts;

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


  canTrainSpearFighters: boolean;
  canTrainSwordFighters: boolean;
  canTrainAxeFighters: boolean;
  canTrainArchers: boolean;
  canTrainMagicians: boolean;
  canTrainHorsemen: boolean;
  canTrainCatapults: boolean;


  ngOnInit(): void {
  }

  spearFightersInputChange(value: any)
  {
    this.troops.spearFighters = this.fixInputValue(value, this.troops.spearFighters, this.maxPossibleTroops.spearFighters);
    this.onTroopsChange.emit(this.troops);
  }

  swordFightersInputChange(value: any)
  {
    this.troops.swordFighters = this.fixInputValue(value, this.troops.swordFighters, this.maxPossibleTroops.swordFighters);
    this.onTroopsChange.emit(this.troops);
  }

  axeFightersInputChange(value: any)
  {
    this.troops.axeFighters = this.fixInputValue(value, this.troops.axeFighters, this.maxPossibleTroops.axeFighters);
    this.onTroopsChange.emit(this.troops);
  }

  archersInputChange(value: any)
  {
    this.troops.archers = this.fixInputValue(value, this.troops.archers, this.maxPossibleTroops.archers);
    this.onTroopsChange.emit(this.troops);
  }

  magiciansInputChange(value: any)
  {
    this.troops.magicians = this.fixInputValue(value, this.troops.magicians, this.maxPossibleTroops.magicians);
    this.onTroopsChange.emit(this.troops);
  }

  horsemenInputChange(value: any)
  {
    this.troops.horsemen = this.fixInputValue(value, this.troops.horsemen, this.maxPossibleTroops.horsemen);
    this.onTroopsChange.emit(this.troops);
  }
  
  catapultsInputChange(value: any)
  {
    this.troops.catapults = this.fixInputValue(value, this.troops.catapults, this.maxPossibleTroops.catapults);
    this.onTroopsChange.emit(this.troops);
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
    this.onTroopsChange.emit(this.troops);
  }

  maxSwordFighters()
  {
    this.troops.swordFighters += this.maxPossibleTroops.swordFighters;
    this.onTroopsChange.emit(this.troops);
  }

  maxAxeFighters()
  {
    this.troops.axeFighters += this.maxPossibleTroops.axeFighters;
    this.onTroopsChange.emit(this.troops);
  }

  maxArchers()
  {
    this.troops.archers += this.maxPossibleTroops.archers;
    this.onTroopsChange.emit(this.troops);
  }

  maxMagicians()
  {
    this.troops.magicians += this.maxPossibleTroops.magicians;
    this.onTroopsChange.emit(this.troops);
  }

  maxHorsemen()
  {
    this.troops.horsemen += this.maxPossibleTroops.horsemen;
    this.onTroopsChange.emit(this.troops);
  }

  maxCatapults()
  {
    this.troops.catapults += this.maxPossibleTroops.catapults
    this.onTroopsChange.emit(this.troops);
  }

  

}
