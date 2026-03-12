import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AttackReport } from '../models/attackReport';
import { TroopsAmounts } from 'src/app/main-panel/models/troopsAmounts';

@Component({
  selector: 'app-scout-report',
  templateUrl: './scout-report.component.html',
  styleUrls: ['./scout-report.component.scss']
})
export class ScoutReportComponent {
  @Input() report!: AttackReport;
  @Input() currentUsername: string = '';
  @Output() closed = new EventEmitter<void>();

  constructor(private router: Router) {}

  get isAttacker(): boolean {
    return this.report.attackerName === this.currentUsername;
  }

  get wasSuccessful(): boolean {
    return this.report.attackerWon;
  }

  goBack(): void {
    this.closed.emit();
  }

  navigateToPlayer(username: string): void {
    this.router.navigate(['player', username]);
  }

  hasSupportTroops(): boolean {
    const t = this.report.supportTotalTroops;
    if (!t) return false;
    return (t.spearFighters || 0) + (t.swordFighters || 0) + (t.axeFighters || 0) +
      (t.archers || 0) + (t.magicians || 0) + (t.horsemen || 0) + (t.catapults || 0) > 0;
  }
}
