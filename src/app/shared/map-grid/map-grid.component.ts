import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BossOnMap, OasisOnMap, VillageOnMap } from '../../world-map/models/mapModels';
import { BossService } from '../../world-map/services/boss.service';

export interface GridCell {
  x: number;
  y: number;
  village: VillageOnMap | null;
  boss: BossOnMap | null;
  oasis: OasisOnMap | null;
}

@Component({
  selector: 'app-map-grid',
  templateUrl: './map-grid.component.html',
  styleUrls: ['./map-grid.component.scss'],
})
export class MapGridComponent {
  @Input() gridCells: GridCell[][] = [];
  @Input() currentUsername: string = '';
  @Input() currentUserClan: string = '';
  @Input() extraCellClassFn?: (cell: GridCell) => Record<string, boolean>;
  @Output() cellClick = new EventEmitter<GridCell>();

  constructor(public bossService: BossService) {}

  getCellClasses(cell: GridCell): Record<string, boolean> {
    const isOwn =
      !!cell.village && cell.village.ownerUsername === this.currentUsername;
    const isClan =
      !!cell.village &&
      !isOwn &&
      !!this.currentUserClan &&
      cell.village.clanName === this.currentUserClan;

    const classes: Record<string, boolean> = {
      'has-village': !!cell.village,
      'own-village': isOwn,
      'clan-village': isClan,
      'other-village': !!cell.village && !isOwn && !isClan,
      'has-boss': !!cell.boss,
      'has-oasis': !!cell.oasis,
    };

    if (cell.boss) {
      classes[`boss-${cell.boss.tier}`] = true;
    }

    if (this.extraCellClassFn) {
      Object.assign(classes, this.extraCellClassFn(cell));
    }

    return classes;
  }

  getVillageTierIcon(village: VillageOnMap): string {
    const q = village.quartersLevel ?? 1;
    if (q <= 3) return 'assets/tier1-village.png';
    if (q <= 7) return 'assets/tier2-village.png';
    return 'assets/tier3-village.png';
  }

  getVillageTierClass(village: VillageOnMap): string {
    const q = village.quartersLevel ?? 1;
    if (q <= 3) return 'village-icon-tier1';
    if (q <= 7) return 'village-icon-tier2';
    return 'village-icon-tier3';
  }

  isMythicBoss(boss: BossOnMap): boolean {
    return boss.tier === ('mythic' as any);
  }
}
