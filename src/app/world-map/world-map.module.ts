import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainPanelModule } from '../main-panel/main-panel.module';
import { SharedModule } from '../shared/shared.module';
import { BossInteractionComponent } from './boss-interaction/boss-interaction.component';
import { VillageInteractionComponent } from './village-interaction/village-interaction.component';
import { WorldMapComponent } from './world-map/world-map.component';

@NgModule({
  declarations: [
    WorldMapComponent,
    VillageInteractionComponent,
    BossInteractionComponent,
  ],
  imports: [CommonModule, MainPanelModule, FormsModule, SharedModule],
  exports: [
    WorldMapComponent,
    VillageInteractionComponent,
    BossInteractionComponent,
  ],
})
export class WorldMapModule {}
