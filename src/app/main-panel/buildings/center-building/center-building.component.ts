import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { centerBuildingUpgradeMaterialCostByLevels } from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
import { WorldMapService } from 'src/app/world-map/services/world-map.service';
import { User } from '../../models/User';

const NEW_VILLAGE_REQUIRED_LEVEL = 10;

@Component({
  selector: 'app-center-building',
  templateUrl: './center-building.component.html',
  styleUrls: ['./center-building.component.scss']
})
export class CenterBuildingComponent implements OnInit, OnDestroy {

  buildingInformation: Building;
  canCreateNewVillage: boolean = false;
  showNewVillageUI: boolean = false;
  availableCells: { x: number; y: number }[] = [];
  selectedCell: { x: number; y: number } | null = null;
  newVillageName: string = '';
  subscription?: Subscription;

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
    const totalVillages = this.userInformationService.userInformation.villages.length;
    const villagesAtLevel10 = this.userInformationService.userInformation.villages.filter(
      v => v.buildingsLevels.centerBuildingLevel >= NEW_VILLAGE_REQUIRED_LEVEL
    ).length;
    
    // Can create new village if current is level 10 and hasn't been used yet
    // Each level 10 village can create one new village
    this.canCreateNewVillage = currentLevel >= NEW_VILLAGE_REQUIRED_LEVEL && 
      (totalVillages - 1) < villagesAtLevel10;
  }

  openNewVillageUI(): void {
    this.showNewVillageUI = true;
    this.loadAvailableCells();
  }

  closeNewVillageUI(): void {
    this.showNewVillageUI = false;
    this.selectedCell = null;
    this.newVillageName = '';
  }

  loadAvailableCells(): void {
    const currentLocation = this.userInformationService.currentVillage.location;
    this.worldMapService.getAvailableCells(currentLocation.x, currentLocation.y, 5)
      .subscribe(cells => {
        this.availableCells = cells;
      });
  }

  selectCell(cell: { x: number; y: number }): void {
    this.selectedCell = cell;
  }

  isCurrentVillage(x: number, y: number): boolean {
    const loc = this.userInformationService.currentVillage.location;
    return loc.x === x && loc.y === y;
  }

  isCellAvailable(x: number, y: number): boolean {
    return this.availableCells.some(c => c.x === x && c.y === y);
  }

  isCellSelected(x: number, y: number): boolean {
    return this.selectedCell?.x === x && this.selectedCell?.y === y;
  }

  getGridCells(): { x: number; y: number }[][] {
    const loc = this.userInformationService.currentVillage.location;
    const grid: { x: number; y: number }[][] = [];
    
    for (let dy = -5; dy <= 5; dy++) {
      const row: { x: number; y: number }[] = [];
      for (let dx = -5; dx <= 5; dx++) {
        row.push({ x: loc.x + dx, y: loc.y + dy });
      }
      grid.push(row);
    }
    return grid;
  }

  createNewVillage(): void {
    if (!this.selectedCell || !this.newVillageName.trim()) {
      alert('Please select a cell and enter a village name');
      return;
    }

    this.subscription = this.http.post<User>('http://localhost:3000/interactions/create-village', {
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
        alert(err.error?.message || 'Failed to create village');
      }
    });
  }
}
