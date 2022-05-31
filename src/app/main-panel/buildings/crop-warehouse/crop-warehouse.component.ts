import { Component, OnInit } from '@angular/core';
import { woodWarehouseUpgradeMaterialCostByLevels} from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';

@Component({
  selector: 'app-crop-warehouse',
  templateUrl: './crop-warehouse.component.html',
  styleUrls: ['./crop-warehouse.component.scss']
})
export class CropWarehouseComponent implements OnInit {

  buildingInformation: Building;
  constructor(private userInformationService: UserInformationService) { 
    this.buildingInformation = new Building("Crop Warehouse", this.userInformationService.currentVillage.buildingsLevels.cropWarehouseLevel, 
    "The crop warehouse stores the crop of your village. The higher its level, the more crop you can store.",
    woodWarehouseUpgradeMaterialCostByLevels[this.userInformationService.currentVillage.buildingsLevels.woodWarehouseLevel + 1]);
  }

  ngOnInit(): void {
  }

}
