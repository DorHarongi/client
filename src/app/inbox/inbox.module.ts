import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InboxComponent } from './inbox/inbox.component';
import { AttackReportComponent } from './attack-report/attack-report.component';
import { ScoutReportComponent } from './scout-report/scout-report.component';
import { MainPanelModule } from '../main-panel/main-panel.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    InboxComponent,
    AttackReportComponent,
    ScoutReportComponent
  ],
  imports: [
    CommonModule,
    MainPanelModule,
    SharedModule
  ]
})
export class InboxModule { }
