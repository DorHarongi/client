import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { InboxModule } from './inbox/inbox.module';
import { LoginModule } from './login/login.module';
import { MainPanelModule } from './main-panel/main-panel.module';
import { StatisticsModule } from './statistics/statistics.module';
import { WorldMapModule } from './world-map/world-map.module';
import { PlayerModule } from './player/player.module';
import { ClanModule } from './clan/clan.module';
import { QuestsModule } from './quests/quests.module';
import { AuthInterceptor } from './login/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    StatisticsModule,
    InboxModule,
    MainPanelModule,
    LoginModule,
    WorldMapModule,
    PlayerModule,
    ClanModule,
    QuestsModule,
    RouterModule.forRoot(appRoutes),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
