import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestWidgetComponent } from './quest-widget/quest-widget.component';
import { DailyQuestWidgetComponent } from './daily-quest-widget/daily-quest-widget.component';
import { ClanQuestWidgetComponent } from './clan-quest-widget/clan-quest-widget.component';
import { QuestService } from './quest.service';

@NgModule({
  declarations: [
    QuestWidgetComponent,
    DailyQuestWidgetComponent,
    ClanQuestWidgetComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    QuestWidgetComponent,
    DailyQuestWidgetComponent,
    ClanQuestWidgetComponent
  ],
  providers: [
    QuestService
  ]
})
export class QuestsModule { }
