import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerPageComponent } from './player-page/player-page.component';
import { WorldMapModule } from '../world-map/world-map.module';

@NgModule({
  declarations: [
    PlayerPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    WorldMapModule
  ],
  exports: [
    PlayerPageComponent
  ]
})
export class PlayerModule { }
