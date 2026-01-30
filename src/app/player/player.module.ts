import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerPageComponent } from './player-page/player-page.component';

@NgModule({
  declarations: [
    PlayerPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    PlayerPageComponent
  ]
})
export class PlayerModule { }
