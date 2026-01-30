import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestWidgetComponent } from './quest-widget/quest-widget.component';
import { QuestService } from './quest.service';

@NgModule({
  declarations: [
    QuestWidgetComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    QuestWidgetComponent
  ],
  providers: [
    QuestService
  ]
})
export class QuestsModule { }
