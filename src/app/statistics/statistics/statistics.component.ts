import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { ClanService, ClanStatisticDTO } from 'src/app/clan/services/clan.service';
import { environment } from 'src/environments/environment';

const WINDOW_SIZE = 6;

type ViewMode = 'players' | 'clans' | 'leaderboards';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})

export class StatisticsComponent implements OnInit, OnDestroy {

  viewMode: ViewMode = 'players';

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private userInformationService: UserInformationService,
    private clanService: ClanService
  ) {
    this.username = userInformationService.userInformation.username;
    this.userClanName = userInformationService.userInformation.clanName || '';
   }

  ngOnDestroy(): void {
    this.subscription1 && this.subscription1.unsubscribe();
    this.subscription2 && this.subscription2.unsubscribe();
    this.subscription3 && this.subscription3.unsubscribe();
    this.subscription4 && this.subscription4.unsubscribe();
    this.pageForSub?.unsubscribe();
  }

  page: number = 1;
  numberOfPages: number = 1;
  displayedPages: number[] = [];
  usersInPage: Array<any> = [];
  clansInPage: Array<ClanStatisticDTO> = [];
  playerLeaderboard: any[] = [];
  clanLeaderboard: any[] = [];
  previousWeekArchive: {
    weekEnding: string;
    playerBossDamage: any[];
    playerResourcesStolen: any[];
    playerSuccessfulDefenses: any[];
    clanBossDamage: any[];
    clanResourcesStolen: any[];
    clanSuccessfulDefenses: any[];
  } | null = null;
  loading: boolean = true;
  subscription1!: Subscription;
  subscription2!: Subscription;
  subscription3!: Subscription;
  subscription4!: Subscription;
  private pageForSub?: Subscription;
  username: string;
  userClanName: string;
  initialPageLoaded = false;
  initialClanPageLoaded = false;

  leaderboardCategory: 'bossDamage' | 'resourcesStolen' | 'successfulDefenses' = 'bossDamage';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.pageForSub?.unsubscribe();
    if (this.viewMode === 'players') {
      this.getNumberOfUserStatisticsPages();
      if (this.page === 1 && !this.initialPageLoaded) {
        this.pageForSub = this.http.get<{ page: number }>(`${environment.apiUrl}/users/statistics/page-for/${encodeURIComponent(this.username)}`)
          .subscribe({
            next: (res) => {
              if (this.viewMode !== 'players') return;
              this.page = res.page || 1;
              this.initialPageLoaded = true;
              this.updateDisplayedPages();
              this.getUserStatistics();
            },
            error: () => {
              if (this.viewMode !== 'players') return;
              this.page = 1;
              this.initialPageLoaded = true;
              this.getUserStatistics();
            },
          });
      } else {
        this.getUserStatistics();
      }
    } else if (this.viewMode === 'clans') {
      this.getNumberOfClanStatisticsPages();
      const clanName = this.userInformationService.userInformation?.clanName;
      if (this.page === 1 && !this.initialClanPageLoaded && clanName) {
        this.pageForSub = this.clanService.getClanStatisticsPage(clanName)
          .subscribe({
            next: (res) => {
              if (this.viewMode !== 'clans') return;
              this.page = res.page || 1;
              this.initialClanPageLoaded = true;
              this.updateDisplayedPages();
              this.getClanStatistics();
            },
            error: () => {
              if (this.viewMode !== 'clans') return;
              this.page = 1;
              this.initialClanPageLoaded = true;
              this.getClanStatistics();
            },
          });
      } else {
        this.getClanStatistics();
      }
    } else {
      this.loadLeaderboards();
    }
  }

  switchToPlayers(): void {
    if (this.viewMode !== 'players') {
      this.viewMode = 'players';
      this.page = 1;
      this.initialPageLoaded = false;
      this.loadData();
    }
  }

  switchToClans(): void {
    if (this.viewMode !== 'clans') {
      this.viewMode = 'clans';
      this.page = 1;
      this.initialClanPageLoaded = false;
      this.loadData();
    }
  }

  switchToLeaderboards(): void {
    if (this.viewMode !== 'leaderboards') {
      this.viewMode = 'leaderboards';
      this.page = 1;
      this.loadData();
    }
  }

  moveToPage(page: number): void {
    if (page < 1 || page > this.numberOfPages) return; 
    this.page = page;
    if (this.viewMode === 'players') {
      this.getUserStatistics();
    } else if (this.viewMode === 'clans') {
      this.getClanStatistics();
    }
    this.updateDisplayedPages();
  }

   updateDisplayedPages(): void {
    const halfWindow = Math.floor(WINDOW_SIZE / 2);

    let start = Math.max(this.page - halfWindow, 1);
    let end = start + WINDOW_SIZE - 1;

    if (end > this.numberOfPages) {
      end = this.numberOfPages;
      start = Math.max(end - WINDOW_SIZE + 1, 1);
    }

    this.displayedPages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  getNumberOfUserStatisticsPages()
  {
    this.subscription2 = this.http.get<number>(`${environment.apiUrl}/users/statistics`, 
    ).subscribe((numberOfPages)=>{
       this.numberOfPages = numberOfPages;
       this.updateDisplayedPages();
   });
  }

  get anyPlayerHasRelics(): boolean {
    return this.usersInPage.some(u => u.heldRelicIds && u.heldRelicIds.length > 0);
  }

  getUserStatistics()
  {
    this.subscription1 = this.http.get<any>(`${environment.apiUrl}/users/statistics/${this.page}`, 
     ).subscribe((users)=>{
        this.usersInPage = users;
        this.loading = false;
    })
  }

  getNumberOfClanStatisticsPages()
  {
    this.subscription3 = this.clanService.getNumberOfClanStatisticsPages()
      .subscribe((numberOfPages)=>{
        this.numberOfPages = numberOfPages || 1;
        this.updateDisplayedPages();
      });
  }

  getClanStatistics()
  {
    this.subscription4 = this.clanService.getClanStatistics(this.page)
      .subscribe((clans)=>{
        this.clansInPage = clans;
        this.loading = false;
      });
  }

  goToClan(clanName: string): void {
    this.router.navigate(['clan', clanName]);
  }

  goToPlayer(username: string): void {
    this.router.navigate(['player', username]);
  }

  goBack()
  {
    this.router.navigateByUrl('home');
  }

  changeLeaderboardCategory(category: 'bossDamage' | 'resourcesStolen' | 'successfulDefenses'): void {
    if (this.leaderboardCategory !== category) {
      this.leaderboardCategory = category;
      this.loadLeaderboards();
    }
  }

  loadLeaderboards(): void {
    this.loading = true;
    const category = this.leaderboardCategory;

    // Players
    this.http
      .get<any[]>(`${environment.apiUrl}/users/leaderboard/${category}`)
      .subscribe((players) => {
        this.playerLeaderboard = players;
        this.loading = false;
      });

    // Clans
    this.http
      .get<any[]>(`${environment.apiUrl}/users/clans/leaderboard/${category}`)
      .subscribe((clans) => {
        this.clanLeaderboard = clans;
      });

    // Previous week's archive
    this.http
      .get<any>(`${environment.apiUrl}/users/leaderboard-archive`)
      .subscribe((archive) => {
        this.previousWeekArchive = archive;
      });
  }

  getPreviousWeekPlayers(): any[] {
    if (!this.previousWeekArchive) return [];
    const key = this.leaderboardCategory === 'bossDamage' ? 'playerBossDamage'
      : this.leaderboardCategory === 'resourcesStolen' ? 'playerResourcesStolen'
      : 'playerSuccessfulDefenses';
    return (this.previousWeekArchive[key] || []).filter((p: any) => p.stat > 0);
  }

  getPreviousWeekClans(): any[] {
    if (!this.previousWeekArchive) return [];
    const key = this.leaderboardCategory === 'bossDamage' ? 'clanBossDamage'
      : this.leaderboardCategory === 'resourcesStolen' ? 'clanResourcesStolen'
      : 'clanSuccessfulDefenses';
    return (this.previousWeekArchive[key] || []).filter((c: any) => (c.totalStat || c.stat) > 0);
  }

  formatArchiveWeekEnding(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }
}
