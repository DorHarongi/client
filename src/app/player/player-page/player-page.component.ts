import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';

@Component({
  selector: 'app-player-page',
  templateUrl: './player-page.component.html',
  styleUrls: ['./player-page.component.scss']
})
export class PlayerPageComponent implements OnInit, OnDestroy {

  username: string = '';
  playerInfo: any;
  loading: boolean = true;
  isOwnProfile: boolean = false;
  isSameClan: boolean = false;
  currentUsername: string;

  subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private userInformationService: UserInformationService
  ) {
    this.currentUsername = this.userInformationService.userInformation.username;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.username = params['username'];
      this.isOwnProfile = this.username === this.currentUsername;
      this.loadPlayerInfo();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadPlayerInfo(): void {
    this.loading = true;
    this.subscription = this.http.get<any>(`http://localhost:3000/users/profile/${this.username}`)
      .subscribe({
        next: (user) => {
          this.playerInfo = user;
          this.loading = false;
          const currentClan = this.userInformationService.userInformation.clanName;
          this.isSameClan = !!(currentClan && user.clanName && currentClan === user.clanName);
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  getTotalPopulation(): number {
    if (!this.playerInfo?.villages) return 0;
    return this.playerInfo.villages.reduce((sum: number, v: any) => sum + (v.population || 0), 0);
  }

  goToClan(): void {
    if (this.playerInfo?.clanName) {
      this.router.navigate(['clan', this.playerInfo.clanName]);
    }
  }

  goToMap(): void {
    this.router.navigateByUrl('Map');
  }

  goBack(): void {
    this.router.navigateByUrl('home');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
