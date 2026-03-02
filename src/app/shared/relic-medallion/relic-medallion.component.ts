import { Component, Input } from '@angular/core';

const RELIC_IDS = ['apple_of_eternity', 'eternal_flame', 'chalice_of_ascension', 'all_seeing_orb', 'sigil_of_creation'];

@Component({
  selector: 'app-relic-medallion',
  templateUrl: './relic-medallion.component.html',
  styleUrls: ['./relic-medallion.component.scss']
})
export class RelicMedallionComponent {
  @Input() heldRelicIds: string[] = [];
  readonly relicIds = RELIC_IDS;

  isHeld(relicId: string): boolean {
    return this.heldRelicIds && this.heldRelicIds.includes(relicId);
  }
}
