import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorldMapComponent } from './world-map/world-map.component';
import { VillageInteractionComponent } from './village-interaction/village-interaction.component';
import { MainPanelModule } from '../main-panel/main-panel.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    WorldMapComponent,
    VillageInteractionComponent
  ],
  imports: [
    CommonModule,
    MainPanelModule,
    FormsModule
  ],
  exports: [
    WorldMapComponent,
    VillageInteractionComponent
  ]
})
export class WorldMapModule { }
