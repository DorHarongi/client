import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerPageComponent } from './player-page/player-page.component';

@NgModule({
  declarations: [
    PlayerPageComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PlayerPageComponent
  ]
})
export class PlayerModule { }
