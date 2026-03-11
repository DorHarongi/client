import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ResourcesDisplayAmounts } from 'src/app/main-panel/resources-amount/resources-amount.component';
import { TroopsAmounts } from 'src/app/main-panel/models/troopsAmounts';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { AttackReport } from '../models/attackReport';
import { getBossImageByName } from 'utils';

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
    if (!this.userAttackedAndLost && this.attackReport.reportType !== 'boss') {
      const empty = { spearFighters: 0, swordFighters: 0, axeFighters: 0, archers: 0, magicians: 0, horsemen: 0, catapults: 0 };
      this.troopDictionariesByType["defender"] = [];
      this.troopDictionariesByType["support"] = [];
      this.troopDictionariesByType["defender"][0] = this.attackReport.defenderTotalTroops || empty;
      this.troopDictionariesByType["defender"][1] = this.attackReport.defenderTotalLostTroops || empty;
      this.troopDictionariesByType["support"][0] = this.attackReport.supportTotalTroops || empty;
      this.troopDictionariesByType["support"][1] = this.attackReport.supportTotalLostTroops || empty;
    }
  }

  get isBossReport(): boolean {
    return this.attackReport.reportType === 'boss';
  }

  get isOasisReport(): boolean {
    return this.attackReport.reportType === 'oasis';
  }

  getBossImageSrc(): string {
    return 'assets/' + getBossImageByName(this.attackReport.bossName);
  }

  getBossHpPercent(): number {
    const maxHp = this.attackReport.bossMaxHp || this.attackReport.bossHpBefore;
    if (maxHp == null || maxHp <= 0) return 0;
    const after = this.attackReport.bossHpAfter ?? 0;
    return Math.max(0, (after / maxHp) * 100);
  }

  goBack(){
    this.closed.emit();
  }

  didUserAttackAndLost(): boolean{
    return this.attackReport.attackerName == this.userInformationService.userInformation.username && !this.attackReport.attackerWon;
  }

  getLootResources(): ResourcesDisplayAmounts {
    return {
      crop: this.attackReport.lootedResources?.cropAmount || 0,
      wood: this.attackReport.lootedResources?.woodAmount || 0,
      stone: this.attackReport.lootedResources?.stonesAmount || 0
    };
  }
}
