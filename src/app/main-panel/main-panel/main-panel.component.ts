import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { BuildingTypes } from '../models/BuildingTypes';
import { Village } from '../models/Village';
import { IntervalService } from '../services/interval.service';

@Component({
  selector: 'app-main-panel',
  templateUrl: './main-panel.component.html',
  styleUrls: ['./main-panel.component.scss']
})
export class MainPanelComponent implements OnInit, OnDestroy {

  hoveredBuildingIndex: number = -1;
  village!: Village;
  subscription!: Subscription;
  routeSubscription!: Subscription;
  constructor(
    private userInformationService: UserInformationService, 
    private router: Router,
    private route: ActivatedRoute,
    private intervalService: IntervalService
  )
  { 
    this.intervalService.startIntervals();
  }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
    if(this.routeSubscription)
      this.routeSubscription.unsubscribe();
  }

  ngOnInit(): void
  {
    this.village = this.userInformationService.currentVillage;
    
    // Handle village name from route parameter
    this.routeSubscription = this.route.params.subscribe(params => {
      const villageName = params['villageName'];
      if (villageName) {
        const villageIndex = this.userInformationService.userInformation.villages.findIndex(
          v => v.villageName === villageName
        );
        if (villageIndex >= 0 && villageIndex !== this.userInformationService.currentVillageIndex) {
          this.userInformationService.switchVillage(villageIndex);
        }
      }
    });

    this.subscription = this.userInformationService.villageChanged$.subscribe(()=>{
      this.village = this.userInformationService.currentVillage;
      // Update URL to reflect current village
      this.router.navigate(['home', this.village.villageName], { replaceUrl: true });
    })
  }

  handleClickedBuilding(index: number)
  {
    this.router.navigateByUrl("/" + BuildingTypes[index]);
  }

  handleHoveredBuilding(event: any, index: number)
  {
    this.hoveredBuildingIndex = index;
  }

  handleMouseLeave()
  {
    this.hoveredBuildingIndex = -1;
  }

  print(event: any) // for building polygons around buiildings
  {
    // console.log(event.clientX + "," + event.clientY);
  }

}
