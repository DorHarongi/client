import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { InfoModalComponent } from './info-modal/info-modal.component';
import { MapGridComponent } from './map-grid/map-grid.component';
import { RelicMedallionComponent } from './relic-medallion/relic-medallion.component';
import { LinkedTextComponent } from './linked-text/linked-text.component';

@NgModule({
  declarations: [RelicMedallionComponent, MapGridComponent, LinkedTextComponent, InfoModalComponent],
  imports: [CommonModule],
  exports: [RelicMedallionComponent, MapGridComponent, LinkedTextComponent, InfoModalComponent],
})
export class SharedModule {}
