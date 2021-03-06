import { Component, OnInit } from '@angular/core';
import { warehouseStorageByLevel, woodWarehouseUpgradeMaterialCostByLevels, MaterialsCost } from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';



@Component({
  selector: 'app-wood-warehouse',
  templateUrl: './wood-warehouse.component.html',
  styleUrls: ['./wood-warehouse.component.scss']
})
export class WoodWarehouseComponent implements OnInit {

  buildingInformation: Building;
  currentMaximumStorage!: number;
  nextLevelMaximumStorage!: number;

  constructor(private userInformationService: UserInformationService) { 
    this.buildingInformation = new Building("woodWarehouse", "Wood Warehouse",
     this.userInformationService.currentVillage.buildingsLevels.woodWarehouseLevel, 
    "The wood warehouse stores the wood of your village. The higher its level, the more wood you can store.", 
    woodWarehouseUpgradeMaterialCostByLevels[this.userInformationService.currentVillage.buildingsLevels.woodWarehouseLevel + 1]);

    this.currentMaximumStorage = warehouseStorageByLevel[this.buildingInformation.level];
    this.nextLevelMaximumStorage = warehouseStorageByLevel[this.buildingInformation.level + 1];

  }

  ngOnInit(): void {
  }


}
