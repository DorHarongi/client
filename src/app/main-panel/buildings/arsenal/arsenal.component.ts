import { Component, OnInit } from '@angular/core';
import { woodWarehouseUpgradeMaterialCostByLevels } from 'utils'
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';

@Component({
  selector: 'app-arsenal',
  templateUrl: './arsenal.component.html',
  styleUrls: ['./arsenal.component.scss']
})
export class ArsenalComponent implements OnInit {

  buildingInformation: Building;
  constructor(private userInformationService: UserInformationService) { 
    this.buildingInformation = new Building("Arsenal", this.userInformationService.currentVillage.buildingsLevels.arsenalLevel,
    "In the arsenal you can train your army troops. Level up your arsenal to unlock new troops",
    woodWarehouseUpgradeMaterialCostByLevels[this.userInformationService.currentVillage.buildingsLevels.woodWarehouseLevel + 1]);
  }

  ngOnInit(): void {
  }

}
