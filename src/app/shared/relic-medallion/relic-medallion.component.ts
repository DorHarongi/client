import { Component, Input } from '@angular/core';

const RELIC_ICON_MAP: Record<string, string> = {
  apple_of_immortality: 'assets/apple.png',
  eternal_flame: 'assets/flame.png',
  chalice_of_ascension: 'assets/chalice.png',
  all_seeing_orb: 'assets/orn.png',
  sigil_of_thunder: 'assets/sigil.png',
};

const RELIC_IDS = ['apple_of_immortality', 'eternal_flame', 'chalice_of_ascension', 'all_seeing_orb', 'sigil_of_thunder'];

@Component({
  selector: 'app-relic-medallion',
  templateUrl: './relic-medallion.component.html',
  styleUrls: ['./relic-medallion.component.scss']
})
export class RelicMedallionComponent {
  @Input() heldRelicIds: string[] = [];

  get heldRelics(): { id: string; icon: string }[] {
    if (!this.heldRelicIds || this.heldRelicIds.length === 0) return [];
    return RELIC_IDS
      .filter((id) => this.heldRelicIds.includes(id))
      .map((id) => ({ id, icon: RELIC_ICON_MAP[id] || '' }));
  }
}
