import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MapGridComponent } from './map-grid/map-grid.component';
import { RelicMedallionComponent } from './relic-medallion/relic-medallion.component';

@NgModule({
  declarations: [RelicMedallionComponent, MapGridComponent],
  imports: [CommonModule],
  exports: [RelicMedallionComponent, MapGridComponent],
})
export class SharedModule {}
