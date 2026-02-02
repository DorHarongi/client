import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsComponent } from './statistics/statistics.component';
import { MainPanelModule } from '../main-panel/main-panel.module';
import { AttackComponent } from './attack/attack.component';



@NgModule({
  declarations: [
    StatisticsComponent,
    AttackComponent
  ],
  imports: [
    MainPanelModule,
    CommonModule
  ],
  exports: [
    StatisticsComponent,
    AttackComponent
  ]
})
export class StatisticsModule { }
