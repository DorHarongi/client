import { Component, OnInit } from '@angular/core';
import { LoginService } from './login/login.service';
import { ServerService } from './services/server.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  serverEnded = false;
  winningClanName: string | null = null;

  constructor(
    private loginService: LoginService,
    private serverService: ServerService
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
  }

  isLoggedIn(): boolean {
    return this.loginService.isloggedIn;
  }
}
