import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { centerBuildingUpgradeMaterialCostByLevels } from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
import { WorldMapService } from 'src/app/world-map/services/world-map.service';
import { User } from '../../models/User';
import { Village } from '../../models/Village';
import { environment } from 'src/environments/environment';

const NEW_VILLAGE_REQUIRED_LEVEL = 10;

interface GridCell {
  x: number;
  y: number;
  village?: { ownerUsername: string; villageName: string; clanName?: string };
}

@Component({
  selector: 'app-center-building',
  templateUrl: './center-building.component.html',
  styleUrls: ['./center-building.component.scss']
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

  constructor(
    private userInformationService: UserInformationService,
    private worldMapService: WorldMapService,
    private http: HttpClient,
    private router: Router
  ) { 
    this.buildingInformation = new Building("centerBuilding", "Center Building", this.userInformationService.currentVillage.buildingsLevels.centerBuildingLevel, 
    "The main building of your village. Level it up to a certain level will make you be able to level up all other buildings to this level. Once your main building reaches level 10, You can create another village.",
    centerBuildingUpgradeMaterialCostByLevels[this.userInformationService.currentVillage.buildingsLevels.centerBuildingLevel + 1]);
    
    this.checkNewVillageEligibility();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  checkNewVillageEligibility(): void {
    const currentLevel = this.userInformationService.currentVillage.buildingsLevels.centerBuildingLevel;
    const currentVillageIndex = this.userInformationService.currentVillageIndex;
    const totalVillages = this.userInformationService.userInformation.villages.length;
    
    // Check how many villages were created before this one that are level 10+
    // Each level 10 village can create one new village
    // Village at index N can create village at index N+1 (if level 10)
    const isLevel10 = currentLevel >= NEW_VILLAGE_REQUIRED_LEVEL;
    
    // This village has already created a new one if there's a village after it in the list
    // and this village is level 10
    this.hasAlreadyCreatedFromThis = isLevel10 && currentVillageIndex < totalVillages - 1;
    
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
    // Load map window centered on current village (3x3 = range of 1)
    this.worldMapService.getMapWindow(currentLocation.x - 1, currentLocation.y - 1)
      .subscribe(response => {
        // Build 3x3 grid
        this.gridCells = [];
        for (let dy = -1; dy <= 1; dy++) {
          const row: GridCell[] = [];
          for (let dx = -1; dx <= 1; dx++) {
            const x = currentLocation.x + dx;
            const y = currentLocation.y + dy;
            const cell: GridCell = { x, y };
            
            // Find if there's a village at this location from the response
            const villageAtCell = response.villages?.find(v => v.x === x && v.y === y);
            if (villageAtCell) {
              cell.village = {
                ownerUsername: villageAtCell.ownerUsername,
                villageName: villageAtCell.villageName,
                clanName: villageAtCell.clanName
              };
            }
            row.push(cell);
          }
          this.gridCells.push(row);
        }
      });
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

  isOwnVillage(cell: GridCell): boolean {
    if (!cell.village) return false;
    return cell.village.ownerUsername === this.userInformationService.userInformation.username;
  }

  isEnemyVillage(cell: GridCell): boolean {
    if (!cell.village) return false;
    // Not enemy if same clan
    if (this.isClanMemberVillage(cell)) return false;
    return cell.village.ownerUsername !== this.userInformationService.userInformation.username;
  }

  isClanMemberVillage(cell: GridCell): boolean {
    if (!cell.village) return false;
    if (this.isOwnVillage(cell)) return false;
    const userClan = this.userInformationService.userInformation.clanName;
    if (!userClan) return false;
    return cell.village.clanName === userClan;
  }

  isCellAvailable(cell: GridCell): boolean {
    // Available if: no village, not current village location
    return !cell.village && !this.isCurrentVillage(cell);
  }

  isCellSelected(cell: GridCell): boolean {
    return this.selectedCell?.x === cell.x && this.selectedCell?.y === cell.y;
  }

  createNewVillage(): void {
    if (!this.selectedCell || !this.newVillageName.trim()) {
      this.errorMessage = 'Please select a cell and enter a village name';
      return;
    }

    this.subscription = this.http.post<User>(`${environment.apiUrl}/interactions/create-village`, {
      username: this.userInformationService.userInformation.username,
      sourceVillageIndex: this.userInformationService.currentVillageIndex,
      newVillageName: this.newVillageName.trim(),
      x: this.selectedCell.x,
      y: this.selectedCell.y
    }).subscribe({
      next: (user: User) => {
        this.userInformationService.setUserInformation(user);
        // Switch to the new village
        const newVillageIndex = user.villages.length - 1;
        this.userInformationService.switchVillage(newVillageIndex);
        this.router.navigateByUrl('home');
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to create village';
      }
    });
  }
}
