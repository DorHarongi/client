import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ClanService, ClanDTO } from '../services/clan.service';
import { UserInformationService } from 'src/app/user-information/user-information.service';

@Component({
  selector: 'app-clan-page',
  templateUrl: './clan-page.component.html',
  styleUrls: ['./clan-page.component.scss']
})
export class ClanPageComponent implements OnInit, OnDestroy {

  clanName: string = '';
  clanInfo?: ClanDTO;
  loading: boolean = true;
  currentUsername: string;
  currentUserClan: string;
  
  showJoinModal: boolean = false;
  joinMessage: string = '';
  
  isLeader: boolean = false;
  isMember: boolean = false;
  hasAlreadyRequested: boolean = false;

  // Messages for feedback instead of alerts
  successMessage: string = '';
  errorMessage: string = '';

  subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clanService: ClanService,
    private userInformationService: UserInformationService
  ) {
    this.currentUsername = this.userInformationService.userInformation.username;
    this.currentUserClan = this.userInformationService.userInformation.clanName || '';
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.clanName = params['clanName'];
      this.loadClanInfo();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadClanInfo(): void {
    this.loading = true;
    this.subscription = this.clanService.getClan(this.clanName)
      .subscribe({
        next: (clan) => {
          this.clanInfo = clan;
          this.loading = false;
          this.isLeader = clan.leaderUsername === this.currentUsername;
          this.isMember = clan.members.includes(this.currentUsername);
          this.hasAlreadyRequested = this.userInformationService.userInformation.pendingClanRequests?.includes(this.clanName) || false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  goToMember(username: string): void {
    this.router.navigate(['player', username]);
  }

  openJoinModal(): void {
    if (this.clanInfo?.isOpen) {
      // Instant join for open clans
      this.joinClan();
    } else {
      this.showJoinModal = true;
    }
  }

  closeJoinModal(): void {
    this.showJoinModal = false;
    this.joinMessage = '';
  }

  joinClan(): void {
    this.clanService.requestToJoinClan(this.clanName, this.currentUsername, this.joinMessage)
      .subscribe({
        next: () => {
          if (this.clanInfo?.isOpen) {
            // Refresh user info for open clan
            this.userInformationService.updateUser();
            this.loadClanInfo();
          } else {
            this.hasAlreadyRequested = true;
            this.closeJoinModal();
            this.successMessage = 'Join request sent successfully!';
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to join clan';
        }
      });
  }

  leaveClan(): void {
    if (confirm('Are you sure you want to leave this clan?')) {
      this.clanService.leaveClan(this.clanName, this.currentUsername)
        .subscribe({
          next: () => {
            this.userInformationService.updateUser();
            this.loadClanInfo();
          },
          error: (err) => {
            this.errorMessage = err.error?.message || 'Failed to leave clan';
          }
        });
    }
  }

  handleJoinRequest(requestUsername: string, accept: boolean): void {
    this.clanService.handleJoinRequest(this.clanName, this.currentUsername, requestUsername, accept)
      .subscribe({
        next: () => {
          this.loadClanInfo();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to handle request';
        }
      });
  }

  canJoin(): boolean {
    return !this.isMember && !this.currentUserClan && !this.hasAlreadyRequested;
  }

  goBack(): void {
    this.router.navigateByUrl('Statistics');
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
}
