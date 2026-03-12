import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MapGridComponent } from './map-grid/map-grid.component';
import { RelicMedallionComponent } from './relic-medallion/relic-medallion.component';
import { LinkedTextComponent } from './linked-text/linked-text.component';

@NgModule({
  declarations: [RelicMedallionComponent, MapGridComponent, LinkedTextComponent],
  imports: [CommonModule],
  exports: [RelicMedallionComponent, MapGridComponent, LinkedTextComponent],
})
export class SharedModule {}
