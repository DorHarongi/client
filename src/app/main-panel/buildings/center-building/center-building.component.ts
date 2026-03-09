import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GridCell } from 'src/app/shared/map-grid/map-grid.component';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import {
  BossOnMap,
  MapWindowResponse,
  OasisOnMap,
  VillageOnMap,
} from 'src/app/world-map/models/mapModels';
import { WorldMapService } from 'src/app/world-map/services/world-map.service';
import { environment } from 'src/environments/environment';
import { centerBuildingUpgradeMaterialCostByLevels } from 'utils';
import { Building } from '../../classes/Building';
import { User } from '../../models/User';

const NEW_VILLAGE_REQUIRED_LEVEL = 10;
const MAX_VILLAGE_NAME_LENGTH = 20;
const WINDOW_SIZE = 10;

@Component({
  selector: 'app-center-building',
  templateUrl: './center-building.component.html',
  styleUrls: ['./center-building.component.scss'],
})
export class CenterBuildingComponent implements OnInit, OnDestroy {
  buildingInformation: Building;
  canCreateNewVillage: boolean = false;
  hasAlreadyCreatedFromThis: boolean = false;
  showNewVillageUI: boolean = false;
  gridCells: GridCell[][] = [];
  selectedCell: GridCell | null = null;
  newVillageName: string = '';
  subscription?: Subscription;
  errorMessage: string = '';
  maxVillageNameLength = MAX_VILLAGE_NAME_LENGTH;

  // For map display
  villages: VillageOnMap[] = [];
  bosses: BossOnMap[] = [];
  oases: OasisOnMap[] = [];
  windowStartX: number = 0;
  windowStartY: number = 0;
  currentUsername: string;
  currentUserClan: string;

  constructor(
    private userInformationService: UserInformationService,
    private worldMapService: WorldMapService,
    private http: HttpClient,
    private router: Router
  ) {
    this.buildingInformation = new Building(
      'centerBuilding',
      'Center Building',
      this.userInformationService.currentVillage.buildingsLevels.centerBuildingLevel,
      'The main building of your village. Level it up to a certain level will make you be able to level up all other buildings to this level. Once your main building reaches level 10, You can create another village.',
      centerBuildingUpgradeMaterialCostByLevels[
        this.userInformationService.currentVillage.buildingsLevels
          .centerBuildingLevel + 1
      ]
    );

    this.currentUsername = this.userInformationService.userInformation.username;
    this.currentUserClan =
      this.userInformationService.userInformation.clanName || '';

    this.checkNewVillageEligibility();
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  checkNewVillageEligibility(): void {
    const currentLevel =
      this.userInformationService.currentVillage.buildingsLevels
        .centerBuildingLevel;
    const currentVillageIndex = this.userInformationService.currentVillageIndex;
    const totalVillages =
      this.userInformationService.userInformation.villages.length;

    // Check how many villages were created before this one that are level 10+
    // Each level 10 village can create one new village
    // Village at index N can create village at index N+1 (if level 10)
    const isLevel10 = currentLevel >= NEW_VILLAGE_REQUIRED_LEVEL;

    // This village has already created a new one if there's a village after it in the list
    // and this village is level 10
    this.hasAlreadyCreatedFromThis =
      isLevel10 && currentVillageIndex < totalVillages - 1;

    this.canCreateNewVillage = isLevel10 && !this.hasAlreadyCreatedFromThis;
  }

  openNewVillageUI(): void {
    this.showNewVillageUI = true;
    this.errorMessage = '';
    this.loadGridData();
  }

  closeNewVillageUI(): void {
    this.showNewVillageUI = false;
    this.selectedCell = null;
    this.newVillageName = '';
    this.errorMessage = '';
  }

  loadGridData(): void {
    const currentLocation = this.userInformationService.currentVillage.location;
    // Center the 10x10 window on current village
    this.windowStartX = Math.max(0, currentLocation.x - 5);
    this.windowStartY = Math.max(0, currentLocation.y - 5);

    this.worldMapService
      .getMapWindow(this.windowStartX, this.windowStartY)
      .subscribe((response: MapWindowResponse) => {
        this.villages = response.villages;
        this.bosses = response.bosses || [];
        this.oases = response.oases || [];
        this.buildGrid();
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

  selectCell(cell: GridCell): void {
    if (this.isCellAvailable(cell)) {
      this.selectedCell = cell;
      this.errorMessage = '';
    }
  }

  isCurrentVillage(cell: GridCell): boolean {
    const loc = this.userInformationService.currentVillage.location;
    return loc.x === cell.x && loc.y === cell.y;
  }

  isInAvailableArea(cell: GridCell): boolean {
    const loc = this.userInformationService.currentVillage.location;
    const dx = Math.abs(cell.x - loc.x);
    const dy = Math.abs(cell.y - loc.y);
    return dx <= 1 && dy <= 1;
  }

  isCellAvailable(cell: GridCell): boolean {
    return (
      this.isInAvailableArea(cell) &&
      !cell.village &&
      !cell.boss &&
      !cell.oasis &&
      !this.isCurrentVillage(cell)
    );
  }

  isCellSelected(cell: GridCell): boolean {
    return this.selectedCell?.x === cell.x && this.selectedCell?.y === cell.y;
  }

  extraCellClassFn = (cell: GridCell): Record<string, boolean> => {
    return {
      'current-village': this.isCurrentVillage(cell),
      available: this.isCellAvailable(cell),
      'in-available-area':
        this.isInAvailableArea(cell) && !this.isCurrentVillage(cell),
      selected: this.isCellSelected(cell),
    };
  };

  createNewVillage(): void {
    if (!this.selectedCell || !this.newVillageName.trim()) {
      this.errorMessage = 'Please select a cell and enter a village name';
      return;
    }

    if (this.newVillageName.length > MAX_VILLAGE_NAME_LENGTH) {
      this.errorMessage = `Village name cannot exceed ${MAX_VILLAGE_NAME_LENGTH} characters`;
      return;
    }

    this.subscription = this.http
      .post<User>(`${environment.apiUrl}/interactions/create-village`, {
        username: this.userInformationService.userInformation.username,
        sourceVillageIndex: this.userInformationService.currentVillageIndex,
        newVillageName: this.newVillageName.trim(),
        x: this.selectedCell.x,
        y: this.selectedCell.y,
      })
      .subscribe({
        next: (user: User) => {
          this.userInformationService.setUserInformation(user);
          // Switch to the new village
          const newVillageIndex = user.villages.length - 1;
          this.userInformationService.switchVillage(newVillageIndex);
          this.router.navigateByUrl('home');
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create village';
        },
      });
  }
}
