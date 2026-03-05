import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { WorldMapService } from '../services/world-map.service';
import { BossService } from '../services/boss.service';
import { VillageOnMap, BossOnMap, MapWindowResponse, MinimapResponse } from '../models/mapModels';
import { BossTier } from 'utils';

const WINDOW_SIZE = 10;
const MINIMAP_SCALE = 2; // pixels per tile

interface GridCell {
  x: number;
  y: number;
  village: VillageOnMap | null;
  boss: BossOnMap | null;
}

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.component.html',
  styleUrls: ['./world-map.component.scss']
})
export class WorldMapComponent implements OnInit, OnDestroy {

  windowStartX: number = 0;
  windowStartY: number = 0;
  worldSize: number = 100;
  villages: VillageOnMap[] = [];
  bosses: BossOnMap[] = [];
  allVillages: VillageOnMap[] = [];
  allBosses: BossOnMap[] = [];
  selectedVillage: VillageOnMap | null = null;
  selectedBoss: BossOnMap | null = null;
  
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private worldMapService: WorldMapService,
    private userInformationService: UserInformationService,
    public bossService: BossService
  ) {
    this.currentUsername = this.userInformationService.userInformation.username;
    this.currentUserClan = this.userInformationService.userInformation.clanName || '';
    
    // Bind methods for global event listeners
    this.boundMouseMove = this.onMinimapDrag.bind(this);
    this.boundMouseUp = this.onMinimapDragEnd.bind(this);
  }

  ngOnInit(): void {
    // Check for query params to center on specific coordinates
    this.queryParamSub = this.route.queryParams.subscribe(params => {
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
  }

  loadMapWindow(): void {
    this.subscription1 = this.worldMapService.getMapWindow(this.windowStartX, this.windowStartY)
      .subscribe((response: MapWindowResponse) => {
        this.villages = response.villages;
        this.bosses = response.bosses || [];
        this.worldSize = response.worldSize;
        this.buildGrid();
      });
  }

  loadMinimap(): void {
    this.subscription2 = this.worldMapService.getMinimap()
      .subscribe((response: MinimapResponse) => {
        this.allVillages = response.villages;
        this.allBosses = response.bosses || [];
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
        const village = this.villages.find(v => v.x === worldX && v.y === worldY) || null;
        const boss = this.bosses.find(b => b.x === worldX && b.y === worldY) || null;
        row.push({ x: worldX, y: worldY, village, boss });
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
    } else if (cell.village) {
      this.selectedVillage = cell.village;
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
    
    this.windowStartX = Math.max(0, Math.min(x - 5, this.worldSize - WINDOW_SIZE));
    this.windowStartY = Math.max(0, Math.min(y - 5, this.worldSize - WINDOW_SIZE));
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

  private updateMinimapPosition(event: MouseEvent): void {
    if (!this.minimapElement) return;
    
    const rect = this.minimapElement.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / MINIMAP_SCALE);
    const y = Math.floor((event.clientY - rect.top) / MINIMAP_SCALE);
    
    // Center the window on the cursor position
    this.windowStartX = Math.max(0, Math.min(x - 5, this.worldSize - WINDOW_SIZE));
    this.windowStartY = Math.max(0, Math.min(y - 5, this.worldSize - WINDOW_SIZE));
  }

  closeVillageInteraction(): void {
    this.selectedVillage = null;
  }

  closeBossInteraction(): void {
    this.selectedBoss = null;
  }

  onBossDefeated(): void {
    // Don't close modal - let user see the results
    // Remove the defeated boss from local arrays immediately
    if (this.selectedBoss) {
      const bossId = this.selectedBoss.id;
      // Remove from main map bosses
      this.bosses = this.bosses.filter(b => b.id !== bossId);
      // Remove from minimap bosses
      this.allBosses = this.allBosses.filter(b => b.id !== bossId);
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
    return boss.claimedByClanName === this.currentUserClan && !!this.currentUserClan;
  }

  goBack(): void {
    this.router.navigateByUrl('home');
  }

  getMinimapVillageStyle(village: VillageOnMap): any {
    return {
      left: (village.x * MINIMAP_SCALE) + 'px',
      top: (village.y * MINIMAP_SCALE) + 'px'
    };
  }

  getMinimapBossStyle(boss: BossOnMap): any {
    return {
      left: (boss.x * MINIMAP_SCALE - 4) + 'px',
      top: (boss.y * MINIMAP_SCALE - 4) + 'px'
    };
  }

  getMinimapWindowStyle(): any {
    return {
      left: (this.windowStartX * MINIMAP_SCALE) + 'px',
      top: (this.windowStartY * MINIMAP_SCALE) + 'px',
      width: (WINDOW_SIZE * MINIMAP_SCALE) + 'px',
      height: (WINDOW_SIZE * MINIMAP_SCALE) + 'px'
    };
  }

  getMinimapSize(): number {
    return this.worldSize * MINIMAP_SCALE;
  }

  getBossCellClass(boss: BossOnMap): string {
    const classes = ['has-boss', `boss-${boss.tier}`];
    if (boss.tier !== 'mythic') {
      if (this.isBossClaimedByMyClan(boss)) {
        classes.push('boss-claimed-by-me');
      } else if (boss.claimedByClanName) {
        classes.push('boss-claimed');
      }
    }
    return classes.join(' ');
  }

  /** Quarters 1-3: tier1, 4-7: tier2, 8-10: tier3 */
  getVillageTierIcon(village: VillageOnMap): string {
    const q = village.quartersLevel ?? 1;
    if (q <= 3) return 'assets/tier1-village.png';
    if (q <= 7) return 'assets/tier2-village.png';
    return 'assets/tier3-village.png';
  }
}
