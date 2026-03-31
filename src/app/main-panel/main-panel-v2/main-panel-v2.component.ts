import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { QuestService } from 'src/app/quests/quest.service';
import { IntervalService } from '../services/interval.service';
import { WeatherService } from '../services/weather.service';
import { MainPanelComponent } from '../main-panel/main-panel.component';

@Component({
  selector: 'app-main-panel-v2',
  templateUrl: './main-panel-v2.component.html',
  styleUrls: ['../main-panel/main-panel.component.scss']
})
export class MainPanelV2Component extends MainPanelComponent {
  constructor(
    userInformationService: UserInformationService,
    questService: QuestService,
    router: Router,
    route: ActivatedRoute,
    intervalService: IntervalService,
    sanitizer: DomSanitizer,
    weatherService: WeatherService
  ) {
    super(userInformationService, questService, router, route, intervalService, sanitizer, weatherService);
  }
}
