import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { WorldMapService } from '../services/world-map.service';
import { VillageOnMap, MapWindowResponse, MinimapResponse } from '../models/mapModels';

const WINDOW_SIZE = 10;
const MINIMAP_SCALE = 2; // pixels per tile

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
  allVillages: VillageOnMap[] = [];
  selectedVillage: VillageOnMap | null = null;
  
  gridCells: { x: number; y: number; village: VillageOnMap | null }[][] = [];
  
  subscription1?: Subscription;
  subscription2?: Subscription;
  
  currentUsername: string;

  constructor(
    private router: Router,
    private worldMapService: WorldMapService,
    private userInformationService: UserInformationService
  ) {
    this.currentUsername = this.userInformationService.userInformation.username;
    // Center map on user's first village
    const firstVillage = this.userInformationService.currentVillage;
    if (firstVillage?.location) {
      this.windowStartX = Math.max(0, firstVillage.location.x - 5);
      this.windowStartY = Math.max(0, firstVillage.location.y - 5);
    }
  }

  ngOnInit(): void {
    this.loadMapWindow();
    this.loadMinimap();
  }

  ngOnDestroy(): void {
    this.subscription1?.unsubscribe();
    this.subscription2?.unsubscribe();
  }

  loadMapWindow(): void {
    this.subscription1 = this.worldMapService.getMapWindow(this.windowStartX, this.windowStartY)
      .subscribe((response: MapWindowResponse) => {
        this.villages = response.villages;
        this.worldSize = response.worldSize;
        this.buildGrid();
      });
  }

  loadMinimap(): void {
    this.subscription2 = this.worldMapService.getMinimap()
      .subscribe((response: MinimapResponse) => {
        this.allVillages = response.villages;
        this.worldSize = response.worldSize;
      });
  }

  buildGrid(): void {
    this.gridCells = [];
    for (let y = 0; y < WINDOW_SIZE; y++) {
      const row: { x: number; y: number; village: VillageOnMap | null }[] = [];
      for (let x = 0; x < WINDOW_SIZE; x++) {
        const worldX = this.windowStartX + x;
        const worldY = this.windowStartY + y;
        const village = this.villages.find(v => v.x === worldX && v.y === worldY) || null;
        row.push({ x: worldX, y: worldY, village });
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

  onCellClick(cell: { x: number; y: number; village: VillageOnMap | null }): void {
    if (cell.village) {
      this.selectedVillage = cell.village;
    }
  }

  onMinimapClick(event: MouseEvent): void {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / MINIMAP_SCALE);
    const y = Math.floor((event.clientY - rect.top) / MINIMAP_SCALE);
    
    this.windowStartX = Math.max(0, Math.min(x - 5, this.worldSize - WINDOW_SIZE));
    this.windowStartY = Math.max(0, Math.min(y - 5, this.worldSize - WINDOW_SIZE));
    this.loadMapWindow();
  }

  closeVillageInteraction(): void {
    this.selectedVillage = null;
  }

  isOwnVillage(village: VillageOnMap): boolean {
    return village.ownerUsername === this.currentUsername;
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
}
