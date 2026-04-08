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

  get isOasisSpy(): boolean {
    return this.report.reportType === 'oasis_spy';
  }

  get hasOasisOwner(): boolean {
    return !!this.report.defenderName && this.report.defenderName.length > 0;
  }

  get hasGarrisonTroops(): boolean {
    const t = this.report.defenderTotalTroops;
    if (!t) return false;
    return (t.spearFighters || 0) + (t.swordFighters || 0) + (t.axeFighters || 0) +
      (t.archers || 0) + (t.magicians || 0) + (t.horsemen || 0) + (t.catapults || 0) > 0;
  }

  goBack(): void {
    this.closed.emit();
  }

  navigateToPlayer(username: string): void {
    this.router.navigate(['player', username]);
  }

  navigateToMap(x?: number, y?: number): void {
    if (x != null && y != null) {
      this.router.navigate(['Map'], { queryParams: { x, y } });
    }
  }

  hasSupportTroops(): boolean {
    const t = this.report.supportTotalTroops;
    if (!t) return false;
    return (t.spearFighters || 0) + (t.swordFighters || 0) + (t.axeFighters || 0) +
      (t.archers || 0) + (t.magicians || 0) + (t.horsemen || 0) + (t.catapults || 0) > 0;
  }

  get hasDefenderResources(): boolean {
    const r = this.report.defenderResources;
    return !!r && ((r.wood || 0) + (r.stone || 0) + (r.crop || 0)) > 0;
  }

  get isMultiSpy(): boolean {
    return (this.report.spySentCount || 0) > 1;
  }

  get spySentCount(): number {
    return this.report.spySentCount || 1;
  }

  get spyCaughtCount(): number {
    return this.report.spyCaughtCount || 0;
  }

  get spySurvivedCount(): number {
    return this.spySentCount - this.spyCaughtCount;
  }
}
