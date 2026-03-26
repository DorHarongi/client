import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { TroopsAmounts } from 'src/app/main-panel/models/troopsAmounts';
import { User } from 'src/app/main-panel/models/User';
import { calculateTroopStats } from 'src/app/shared/troop-stats.util';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { environment } from 'src/environments/environment';
import { calculateDistance, calculateTravelTimeMs, getArmySpeed, getSkillBonus, SkillCategory } from 'utils';

@Component({
  selector: 'app-attack',
  templateUrl: './attack.component.html',
  styleUrls: ['./attack.component.scss']
})
export class AttackComponent implements OnInit, OnDestroy {

  @Input() defenderName!: string;
  @Input() defenderVillageIndex: number = 0;
  @Input() defenderLocation?: { x: number; y: number };
  @Output() closed: EventEmitter<any> = new EventEmitter<any>();

  maxPossibleTroops: TroopsAmounts;
  chosenTroops!: TroopsAmounts;
  subscription!: Subscription;

  totalAttack: number = 0;
  effectiveAttack: number = 0;
  armySpeed: number = 0;
  travelTimeMs: number = 0;

  constructor(private userInformationService: UserInformationService, private http: HttpClient, private router: Router) {
    let userTroops = this.userInformationService.currentVillage.troops;
    this.maxPossibleTroops = new TroopsAmounts(userTroops.spearFighters, userTroops.swordFighters, userTroops.axeFighters,
      userTroops.archers, userTroops.magicians, userTroops.horsemen, userTroops.catapults);
   }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  ngOnInit(): void {
  }

  attackVillage()
  {
    if (!this.hasSelectedTroops()) {
      return;
    }
    let observable: Observable<any>  = this.http.post<any>(`${environment.apiUrl}/attack`,
    {
      defenderName: this.defenderName,
      attackerName: this.userInformationService.userInformation.username,
      attackerVillageIndex: this.userInformationService.currentVillageIndex,
      defenderVillageIndex: this.defenderVillageIndex,
      attackingTroops: this.chosenTroops
    });
    this.subscription = observable.subscribe((user: User)=>{
      this.userInformationService.setUserInformation(user);
      this.router.navigateByUrl('home');
    })
  }

  hasSelectedTroops(): boolean {
    if (!this.chosenTroops) return false;
    const total = this.chosenTroops.spearFighters + this.chosenTroops.swordFighters + 
      this.chosenTroops.axeFighters + this.chosenTroops.archers + 
      this.chosenTroops.magicians + this.chosenTroops.horsemen + this.chosenTroops.catapults;
    return total > 0;
  }

  goBack(){
    this.closed.emit();
  }

  troopsChanged(troops: TroopsAmounts)
  {
    this.chosenTroops = troops;
    this.updateMaximumPossibleTroopsToAttack();
    this.updateTotalStats();
    this.updateTravelStats();
  }

  updateTotalStats(): void {
    if (!this.chosenTroops) {
      this.totalAttack = 0;
      this.effectiveAttack = 0;
      return;
    }
    const village = this.userInformationService.currentVillage;
    const stats = calculateTroopStats(this.chosenTroops, {
      skills: (village as any)?.skills,
      applyAttackSkillBonus: true,
    });
    this.totalAttack = stats.baseAttack;
    this.effectiveAttack = stats.effectiveAttack;
  }

  updateTravelStats(): void {
    if (!this.chosenTroops || !this.defenderLocation) {
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
      currentVillage.location.x, currentVillage.location.y,
      this.defenderLocation.x, this.defenderLocation.y
    );
    const skills = (currentVillage as any)?.skills;
    const quickStepBonus = skills ? getSkillBonus(skills, SkillCategory.QUICK_STEP) : 0;
    this.travelTimeMs = calculateTravelTimeMs(distance, this.armySpeed, quickStepBonus);
  }

  get displayAttack(): number {
    return this.effectiveAttack;
  }

  get hasAttackBonus(): boolean {
    const skills = (this.userInformationService.currentVillage as any)?.skills;
    return skills ? getSkillBonus(skills, SkillCategory.SHARPER_BLADES) > 0 : false;
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

  updateMaximumPossibleTroopsToAttack(){
    this.maxPossibleTroops.spearFighters = this.userInformationService.currentVillage.troops.spearFighters - this.chosenTroops.spearFighters;
    this.maxPossibleTroops.swordFighters = this.userInformationService.currentVillage.troops.swordFighters - this.chosenTroops.swordFighters;
    this.maxPossibleTroops.axeFighters = this.userInformationService.currentVillage.troops.axeFighters - this.chosenTroops.axeFighters;
    this.maxPossibleTroops.archers = this.userInformationService.currentVillage.troops.archers - this.chosenTroops.archers;
    this.maxPossibleTroops.magicians = this.userInformationService.currentVillage.troops.magicians - this.chosenTroops.magicians;
    this.maxPossibleTroops.horsemen = this.userInformationService.currentVillage.troops.horsemen - this.chosenTroops.horsemen;
    this.maxPossibleTroops.catapults = this.userInformationService.currentVillage.troops.catapults - this.chosenTroops.catapults;
  }

}
