import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GridCell } from 'src/app/shared/map-grid/map-grid.component';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import {
  BossOnMap,
  MapWindowResponse,
  MinimapResponse,
  OasisOnMap,
  VillageOnMap,
} from '../models/mapModels';
import { WorldMapService } from '../services/world-map.service';

const WINDOW_SIZE = 10;
const MINIMAP_SCALE = 2; // pixels per tile

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.component.html',
  styleUrls: ['./world-map.component.scss'],
})
export class WorldMapComponent implements OnInit, OnDestroy {
  windowStartX: number = 0;
  windowStartY: number = 0;
  worldSize: number = 100;
  villages: VillageOnMap[] = [];
  bosses: BossOnMap[] = [];
  oases: OasisOnMap[] = [];
  allVillages: VillageOnMap[] = [];
  allBosses: BossOnMap[] = [];
  allOases: OasisOnMap[] = [];
  selectedVillage: VillageOnMap | null = null;
  selectedBoss: BossOnMap | null = null;
  selectedOasis: OasisOnMap | null = null;

  gridCells: GridCell[][] = [];

  subscription1?: Subscription;
  subscription2?: Subscription;
  queryParamSub?: Subscription;

  currentUsername: string;
  currentUserClan: string;

  // Minimap dragging state
  isDragging: boolean = false;
  private boundMouseMove: (event: MouseEvent) => void;
  private boundMouseUp: (event: MouseEvent) => void;
  private boundTouchMove: (event: TouchEvent) => void;
  private boundTouchEnd: (event: TouchEvent) => void;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private worldMapService: WorldMapService,
    private userInformationService: UserInformationService
  ) {
    this.currentUsername = this.userInformationService.userInformation.username;
    this.currentUserClan =
      this.userInformationService.userInformation.clanName || '';

    // Bind methods for global event listeners
    this.boundMouseMove = this.onMinimapDrag.bind(this);
    this.boundMouseUp = this.onMinimapDragEnd.bind(this);
    this.boundTouchMove = this.onMinimapTouchDrag.bind(this);
    this.boundTouchEnd = this.onMinimapTouchEnd.bind(this);
  }

  ngOnInit(): void {
    // Check for query params to center on specific coordinates
    this.queryParamSub = this.route.queryParams.subscribe((params) => {
      if (params['x'] !== undefined && params['y'] !== undefined) {
        const x = parseInt(params['x'], 10);
        const y = parseInt(params['y'], 10);
        // Center the window on the specified coordinates
        this.windowStartX = Math.max(0, x - 5);
        this.windowStartY = Math.max(0, y - 5);
      } else {
        // Default: center on user's first village
        const firstVillage = this.userInformationService.currentVillage;
        if (firstVillage?.location) {
          this.windowStartX = Math.max(0, firstVillage.location.x - 5);
          this.windowStartY = Math.max(0, firstVillage.location.y - 5);
        }
      }
      this.loadMapWindow();
    });
    this.loadMinimap();
  }

  ngOnDestroy(): void {
    this.subscription1?.unsubscribe();
    this.subscription2?.unsubscribe();
    this.queryParamSub?.unsubscribe();
    // Clean up drag event listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('touchmove', this.boundTouchMove);
    document.removeEventListener('touchend', this.boundTouchEnd);
  }

  loadMapWindow(): void {
    this.subscription1 = this.worldMapService
      .getMapWindow(this.windowStartX, this.windowStartY)
      .subscribe((response: MapWindowResponse) => {
        this.villages = response.villages;
        this.bosses = response.bosses || [];
        this.oases = response.oases || [];
        this.worldSize = response.worldSize;
        this.buildGrid();
      });
  }

  loadMinimap(): void {
    this.subscription2 = this.worldMapService
      .getMinimap()
      .subscribe((response: MinimapResponse) => {
        this.allVillages = response.villages;
        this.allBosses = response.bosses || [];
        this.allOases = response.oases || [];
        this.worldSize = response.worldSize;
      });
  }

  buildGrid(): void {
    this.gridCells = [];
    for (let y = 0; y < WINDOW_SIZE; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < WINDOW_SIZE; x++) {
        const worldX = this.windowStartX + x;
        const worldY = this.windowStartY + y;
        const village =
          this.villages.find((v) => v.x === worldX && v.y === worldY) || null;
        const boss =
          this.bosses.find((b) => b.x === worldX && b.y === worldY) || null;
        const oasis =
          this.oases.find((o) => o.x === worldX && o.y === worldY) || null;
        row.push({ x: worldX, y: worldY, village, boss, oasis });
      }
      this.gridCells.push(row);
    }
  }

  moveUp(): void {
    if (this.windowStartY >= WINDOW_SIZE) {
      this.windowStartY -= WINDOW_SIZE;
      this.loadMapWindow();
    }
  }

  moveDown(): void {
    if (this.windowStartY + WINDOW_SIZE < this.worldSize) {
      this.windowStartY += WINDOW_SIZE;
      this.loadMapWindow();
    }
  }

  moveLeft(): void {
    if (this.windowStartX >= WINDOW_SIZE) {
      this.windowStartX -= WINDOW_SIZE;
      this.loadMapWindow();
    }
  }

  moveRight(): void {
    if (this.windowStartX + WINDOW_SIZE < this.worldSize) {
      this.windowStartX += WINDOW_SIZE;
      this.loadMapWindow();
    }
  }

  onCellClick(cell: GridCell): void {
    if (cell.boss) {
      this.selectedBoss = cell.boss;
      this.selectedVillage = null;
      this.selectedOasis = null;
    } else if (cell.village) {
      this.selectedVillage = cell.village;
      this.selectedBoss = null;
      this.selectedOasis = null;
    } else if (cell.oasis) {
      this.selectedOasis = cell.oasis;
      this.selectedVillage = null;
      this.selectedBoss = null;
    }
  }

  onMinimapClick(event: MouseEvent): void {
    // Only handle click if not dragging (drag end will handle it)
    if (this.isDragging) return;

    // Use currentTarget (the minimap div) instead of target (could be a child element)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / MINIMAP_SCALE);
    const y = Math.floor((event.clientY - rect.top) / MINIMAP_SCALE);

    this.windowStartX = Math.max(
      0,
      Math.min(x - 5, this.worldSize - WINDOW_SIZE)
    );
    this.windowStartY = Math.max(
      0,
      Math.min(y - 5, this.worldSize - WINDOW_SIZE)
    );
    this.loadMapWindow();
  }

  private minimapElement: HTMLElement | null = null;

  onMinimapDragStart(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.minimapElement = event.currentTarget as HTMLElement;

    // Add global listeners for drag and release
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);

    // Move to initial position
    this.updateMinimapPosition(event);
  }

  private onMinimapDrag(event: MouseEvent): void {
    if (!this.isDragging || !this.minimapElement) return;
    event.preventDefault();
    this.updateMinimapPosition(event);
  }

  private onMinimapDragEnd(event: MouseEvent): void {
    if (!this.isDragging) return;

    // Remove global listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);

    this.isDragging = false;
    this.minimapElement = null;

    // Load the map window at the final position
    this.loadMapWindow();
  }

  onMinimapTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.minimapElement = event.currentTarget as HTMLElement;

    document.addEventListener('touchmove', this.boundTouchMove, {
      passive: false,
    });
    document.addEventListener('touchend', this.boundTouchEnd);

    this.updateMinimapPositionFromCoords(
      event.touches[0].clientX,
      event.touches[0].clientY
    );
  }

  private onMinimapTouchDrag(event: TouchEvent): void {
    if (!this.isDragging || !this.minimapElement) return;
    event.preventDefault();
    this.updateMinimapPositionFromCoords(
      event.touches[0].clientX,
      event.touches[0].clientY
    );
  }

  private onMinimapTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) return;

    document.removeEventListener('touchmove', this.boundTouchMove);
    document.removeEventListener('touchend', this.boundTouchEnd);

    this.isDragging = false;
    this.minimapElement = null;
    this.loadMapWindow();
  }

  private updateMinimapPosition(event: MouseEvent): void {
    if (!this.minimapElement) return;
    this.updateMinimapPositionFromCoords(event.clientX, event.clientY);
  }

  private updateMinimapPositionFromCoords(
    clientX: number,
    clientY: number
  ): void {
    if (!this.minimapElement) return;

    const rect = this.minimapElement.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / MINIMAP_SCALE);
    const y = Math.floor((clientY - rect.top) / MINIMAP_SCALE);

    this.windowStartX = Math.max(
      0,
      Math.min(x - 5, this.worldSize - WINDOW_SIZE)
    );
    this.windowStartY = Math.max(
      0,
      Math.min(y - 5, this.worldSize - WINDOW_SIZE)
    );
  }

  closeVillageInteraction(): void {
    this.selectedVillage = null;
    this.worldMapService.invalidateMapCache(this.windowStartX, this.windowStartY);
    this.worldMapService.clearMinimapCache();
    this.loadMapWindow();
    this.loadMinimap();
  }

  closeBossInteraction(): void {
    this.selectedBoss = null;
    this.worldMapService.invalidateMapCache(this.windowStartX, this.windowStartY);
    this.worldMapService.clearMinimapCache();
    this.loadMapWindow();
    this.loadMinimap();
  }

  onBossDefeated(): void {
    // Don't close modal - let user see the results
    // Remove the defeated boss from local arrays immediately
    if (this.selectedBoss) {
      const bossId = this.selectedBoss.id;
      // Remove from main map bosses
      this.bosses = this.bosses.filter((b) => b.id !== bossId);
      // Remove from minimap bosses
      this.allBosses = this.allBosses.filter((b) => b.id !== bossId);
      // Rebuild grid to reflect the change
      this.buildGrid();
    }
  }

  isOwnVillage(village: VillageOnMap): boolean {
    return village.ownerUsername === this.currentUsername;
  }

  isClanMemberVillage(village: VillageOnMap): boolean {
    // Not own village, but same clan (if user has a clan)
    if (!this.currentUserClan || this.isOwnVillage(village)) {
      return false;
    }
    return village.clanName === this.currentUserClan;
  }

  isBossClaimedByMyClan(boss: BossOnMap): boolean {
    return (
      boss.claimedByClanName === this.currentUserClan && !!this.currentUserClan
    );
  }

  goBack(): void {
    this.router.navigateByUrl('home');
  }

  getMinimapVillageStyle(village: VillageOnMap): any {
    return {
      left: village.x * MINIMAP_SCALE + 'px',
      top: village.y * MINIMAP_SCALE + 'px',
    };
  }

  getMinimapBossStyle(boss: BossOnMap): any {
    return {
      left: boss.x * MINIMAP_SCALE - 4 + 'px',
      top: boss.y * MINIMAP_SCALE - 4 + 'px',
    };
  }

  getMinimapOasisStyle(oasis: OasisOnMap): any {
    return {
      left: oasis.x * MINIMAP_SCALE - 4 + 'px',
      top: oasis.y * MINIMAP_SCALE - 4 + 'px',
    };
  }

  closeOasisInteraction(): void {
    this.selectedOasis = null;
    this.worldMapService.invalidateMapCache(this.windowStartX, this.windowStartY);
    this.worldMapService.clearMinimapCache();
    this.loadMapWindow();
    this.loadMinimap();
  }

  getMinimapWindowStyle(): any {
    return {
      left: this.windowStartX * MINIMAP_SCALE + 'px',
      top: this.windowStartY * MINIMAP_SCALE + 'px',
      width: WINDOW_SIZE * MINIMAP_SCALE + 'px',
      height: WINDOW_SIZE * MINIMAP_SCALE + 'px',
    };
  }

  getMinimapSize(): number {
    return this.worldSize * MINIMAP_SCALE;
  }

  extraCellClassFn = (cell: GridCell): Record<string, boolean> => {
    if (cell.boss && cell.boss.tier !== ('mythic' as any)) {
      return {
        'boss-claimed-by-me': this.isBossClaimedByMyClan(cell.boss),
        'boss-claimed':
          !this.isBossClaimedByMyClan(cell.boss) &&
          !!cell.boss.claimedByClanName,
      };
    }
    if (cell.oasis && cell.oasis.ownerType) {
      return {
        'oasis-owned-by-me': cell.oasis.ownerType === 'mine',
        'oasis-clan-owned': cell.oasis.ownerType === 'clan',
      };
    }
    return {};
  };
}
