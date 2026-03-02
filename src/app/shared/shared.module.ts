import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelicMedallionComponent } from './relic-medallion/relic-medallion.component';

@NgModule({
  declarations: [RelicMedallionComponent],
  imports: [CommonModule],
  exports: [RelicMedallionComponent]
})
export class SharedModule { }
