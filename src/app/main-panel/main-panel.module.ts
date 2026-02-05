import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainPanelComponent } from './main-panel/main-panel.component';
import { TopToolbarComponent } from './top-toolbar/top-toolbar.component';
import { RightToolbarComponent } from './right-toolbar/right-toolbar.component';
import { WoodFactoryComponent } from './buildings/wood-factory/wood-factory.component';
import { BuildingComponent } from './buildings/building/building.component';
import { CenterBuildingComponent } from './buildings/center-building/center-building.component';
import { WoodWarehouseComponent } from './buildings/wood-warehouse/wood-warehouse.component';
import { StoneWarehouseComponent } from './buildings/stone-warehouse/stone-warehouse.component';
import { StoneMineComponent } from './buildings/stone-mine/stone-mine.component';
import { CropWarehouseComponent } from './buildings/crop-warehouse/crop-warehouse.component';
import { CropFarmComponent } from './buildings/crop-farm/crop-farm.component';
import { ArsenalComponent } from './buildings/arsenal/arsenal.component';
import { QuartersComponent } from './buildings/quarters/quarters.component';
import { WallComponent } from './buildings/wall/wall.component';
import { EmbassyComponent } from './buildings/embassy/embassy.component';
import { AcademyComponent } from './buildings/academy/academy.component';
import { FormsModule } from '@angular/forms';
import { MaterialsCostComponent } from './materials-cost/materials-cost.component';
import { TroopsChoosingComponent } from './troops-choosing/troops-choosing.component';
import { HireWorkersComponent } from './hire-workers/hire-workers.component';
import { ResourcesAmountComponent } from './resources-amount/resources-amount.component';


@NgModule({
  declarations: [
    MainPanelComponent,
    TopToolbarComponent,
    RightToolbarComponent,
    WoodFactoryComponent,
    BuildingComponent,
    CenterBuildingComponent,
    WoodWarehouseComponent,
    StoneWarehouseComponent,
    StoneMineComponent,
    CropWarehouseComponent,
    CropFarmComponent,
    ArsenalComponent,
    QuartersComponent,
    WallComponent,
    EmbassyComponent,
    AcademyComponent,
    MaterialsCostComponent,
    TroopsChoosingComponent,
    HireWorkersComponent,
    ResourcesAmountComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports:[
    MainPanelComponent,
    TopToolbarComponent,
    TroopsChoosingComponent,
    ResourcesAmountComponent
  ]
})
export class MainPanelModule { }
