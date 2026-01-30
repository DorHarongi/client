import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { TroopsAmounts } from 'src/app/main-panel/models/troopsAmounts';
import { User } from 'src/app/main-panel/models/User';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-attack',
  templateUrl: './attack.component.html',
  styleUrls: ['./attack.component.scss']
})
export class AttackComponent implements OnInit, OnDestroy {

  @Input() defenderName!: string;
  @Output() closed: EventEmitter<any> = new EventEmitter<any>();

  maxPossibleTroops: TroopsAmounts;
  chosenTroops!: TroopsAmounts;
  subscription!: Subscription;

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
      defenderVillageIndex: 0,
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
