import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ResourcesDisplayAmounts } from 'src/app/main-panel/resources-amount/resources-amount.component';
import { TroopsAmounts } from 'src/app/main-panel/models/troopsAmounts';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { AttackReport } from '../models/attackReport';

@Component({
  selector: 'app-attack-report',
  templateUrl: './attack-report.component.html',
  styleUrls: ['./attack-report.component.scss']
})
export class AttackReportComponent implements OnInit {

  @Input() attackReport!: AttackReport;
  @Output() closed: EventEmitter<any> = new EventEmitter<any>();
  troopDictionariesByType: {[troopsType: string]: TroopsAmounts[]} = {};
  userAttackedAndLost!: boolean;



  constructor(private userInformationService: UserInformationService) { }

  ngOnInit(): void {
    this.userAttackedAndLost = this.didUserAttackAndLost(); 

    this.troopDictionariesByType["attacker"] = [];
    this.troopDictionariesByType["attacker"][0] = this.attackReport.attackerTroops;
    this.troopDictionariesByType["attacker"][1] = this.attackReport.attackerLostTroops;
    if(!this.userAttackedAndLost)
    {
      this.troopDictionariesByType["defender"] = [];
      this.troopDictionariesByType["support"] = [];
      this.troopDictionariesByType["defender"][0] = this.attackReport.defenderTotalTroops;
      this.troopDictionariesByType["defender"][1] = this.attackReport.defenderTotalLostTroops;
      this.troopDictionariesByType["support"][0] = this.attackReport.supportTotalTroops;
      this.troopDictionariesByType["support"][1] = this.attackReport.supportTotalLostTroops;
    }
        
  }


  goBack(){
    this.closed.emit();
  }

  didUserAttackAndLost(): boolean{
    return this.attackReport.attackerName == this.userInformationService.userInformation.username &&!this.attackReport.attackerWon;
  }

  getLootResources(): ResourcesDisplayAmounts {
    return {
      crop: this.attackReport.lootedResources?.cropAmount || 0,
      wood: this.attackReport.lootedResources?.woodAmount || 0,
      stone: this.attackReport.lootedResources?.stonesAmount || 0
    };
  }

}
