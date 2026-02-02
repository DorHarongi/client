import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerPageComponent } from './player-page/player-page.component';
import { WorldMapModule } from '../world-map/world-map.module';
import { StatisticsModule } from '../statistics/statistics.module';

@NgModule({
  declarations: [
    PlayerPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    WorldMapModule,
    StatisticsModule
  ],
  exports: [
    PlayerPageComponent
  ]
})
export class PlayerModule { }
