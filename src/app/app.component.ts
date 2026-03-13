import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoginService } from './login/login.service';
import { ServerService } from './services/server.service';

const MAIN_SCREEN_ROUTES = new Set([
  '/home', '/CenterBuilding', '/WoodWarehouse', '/WoodFactory',
  '/StoneWarehouse', '/StoneMine', '/CropWarehouse', '/CropFarm',
  '/Arsenal', '/Quarters', '/Wall', '/Embassy', '/Academy', '/Stable',
]);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  serverEnded = false;
  winningClanName: string | null = null;
  isMainScreen = true;

  constructor(
    private loginService: LoginService,
    private serverService: ServerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.serverService.getStatus().subscribe({
      next: (s) => {
        this.serverService.setServerStatus(s);
        this.serverEnded = this.serverService.serverEnded;
        this.winningClanName = this.serverService.winningClanName;
      },
      error: () => {}
    });

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      const url = e.urlAfterRedirects || e.url;
      const path = url.split('?')[0];
      this.isMainScreen = MAIN_SCREEN_ROUTES.has(path) || path.startsWith('/home');
    });
  }

  isLoggedIn(): boolean {
    return this.loginService.isloggedIn;
  }
}
