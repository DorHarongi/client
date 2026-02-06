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
  
  // Weather system
  isRaining: boolean = false;
  isSnowing: boolean = false;
  isRainFading: boolean = false;  // Stops new drops but lets existing ones fall
  isSnowFading: boolean = false;  // Stops new flakes but lets existing ones fall
  rainDrops: number[] = [];
  snowFlakes: number[] = [];
  private weatherCheckInterval: any;
  private weatherTimeout: any;
  private weatherFadeTimeout: any;
  
  constructor(
    private userInformationService: UserInformationService, 
    private router: Router,
    private route: ActivatedRoute,
    private intervalService: IntervalService
  )
  { 
    this.intervalService.startIntervals();
    // Generate arrays for rain drops and snowflakes
    this.rainDrops = Array.from({ length: 150 }, (_, i) => i);
    this.snowFlakes = Array.from({ length: 100 }, (_, i) => i);
  }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
    if(this.routeSubscription)
      this.routeSubscription.unsubscribe();
    if(this.weatherCheckInterval)
      clearInterval(this.weatherCheckInterval);
    if(this.weatherTimeout)
      clearTimeout(this.weatherTimeout);
    if(this.weatherFadeTimeout)
      clearTimeout(this.weatherFadeTimeout);
  }

  ngOnInit(): void
  {
    this.village = this.userInformationService.currentVillage;
    
    // Start weather check system
    this.checkWeather();
    this.weatherCheckInterval = setInterval(() => this.checkWeather(), 1000);
    
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

  // Weather system methods
  private checkWeather(): void {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Only trigger at the start of the minute (seconds 0-1)
    if (seconds > 1) return;
    
    // Already showing weather, don't restart
    if (this.isRaining || this.isSnowing) return;
    
    // Snow: divisible by 15 (0, 15, 30, 45)
    if (minutes % 15 === 0) {
      this.startSnow();
    }
    // Rain: divisible by 5 but NOT by 15 (5, 10, 20, 25, 35, 40, 50, 55)
    else if (minutes % 5 === 0) {
      this.startRain();
    }
  }
  
  private startRain(): void {
    this.isRaining = true;
    this.isRainFading = false;
    this.weatherTimeout = setTimeout(() => {
      // Stop generating new drops, but let existing ones finish falling
      this.isRainFading = true;
      // Remove container after drops have time to fall (max ~1.5s animation)
      this.weatherFadeTimeout = setTimeout(() => {
        this.isRaining = false;
        this.isRainFading = false;
      }, 2000);
    }, 20000); // 20 seconds
  }
  
  private startSnow(): void {
    this.isSnowing = true;
    this.isSnowFading = false;
    this.weatherTimeout = setTimeout(() => {
      // Stop generating new flakes, but let existing ones finish falling
      this.isSnowFading = true;
      // Remove container after flakes have time to fall (max ~6s animation)
      this.weatherFadeTimeout = setTimeout(() => {
        this.isSnowing = false;
        this.isSnowFading = false;
      }, 7000);
    }, 20000); // 20 seconds
  }
  
  // Random position/delay generators for weather effects
  getRandomLeft(index: number): number {
    // Use index as seed for consistent but varied positions
    return (index * 17 + index * index) % 100;
  }
  
  getRandomDelay(index: number): number {
    return ((index * 13) % 20) / 10; // 0 to 2 seconds
  }
  
  getRandomDuration(index: number, base: number): number {
    return base + ((index * 7) % 10) / 10; // base to base+1 seconds
  }
  
  getRandomSize(index: number): number {
    return 0.5 + ((index * 11) % 10) / 20; // 0.5 to 1
  }

}
