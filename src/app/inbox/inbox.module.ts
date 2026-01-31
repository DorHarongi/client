import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InboxComponent } from './inbox/inbox.component';
import { AttackReportComponent } from './attack-report/attack-report.component';
import { MainPanelModule } from '../main-panel/main-panel.module';



@NgModule({
  declarations: [
    InboxComponent,
    AttackReportComponent
  ],
  imports: [
    CommonModule,
    MainPanelModule
  ]
})
export class InboxModule { }
