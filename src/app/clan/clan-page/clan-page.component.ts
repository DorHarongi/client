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

  // Clan name editing
  editingClanName: boolean = false;
  newClanName: string = '';

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
    // Refresh username in case user info was loaded after component constructed
    this.currentUsername = this.userInformationService.userInformation?.username || '';
    this.currentUserClan = this.userInformationService.userInformation?.clanName || '';
    
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
    // Ensure we have a valid username
    if (!this.currentUsername) {
      this.currentUsername = this.userInformationService.userInformation?.username;
    }
    
    if (!this.currentUsername) {
      this.errorMessage = 'User session expired. Please refresh the page.';
      return;
    }

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

  kickMember(memberUsername: string): void {
    if (confirm(`Are you sure you want to kick ${memberUsername} from the clan?`)) {
      this.clanService.kickMember(this.clanName, this.currentUsername, memberUsername)
        .subscribe({
          next: () => {
            this.successMessage = `${memberUsername} has been kicked from the clan`;
            setTimeout(() => this.successMessage = '', 3000);
            this.loadClanInfo();
          },
          error: (err) => {
            this.errorMessage = err.error?.message || 'Failed to kick member';
          }
        });
    }
  }

  // Clan name editing
  startEditingClanName(): void {
    this.editingClanName = true;
    this.newClanName = this.clanName;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEditingClanName(): void {
    this.editingClanName = false;
    this.newClanName = '';
  }

  saveClanName(): void {
    if (!this.newClanName.trim()) {
      this.errorMessage = 'Clan name cannot be empty';
      return;
    }

    if (this.newClanName === this.clanName) {
      this.editingClanName = false;
      return;
    }

    this.clanService.updateClanName(this.clanName, this.newClanName.trim(), this.currentUsername)
      .subscribe({
        next: () => {
          this.successMessage = 'Clan name updated successfully!';
          this.userInformationService.updateUser();
          // Navigate to the new clan page
          this.router.navigate(['clan', this.newClanName.trim()]);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update clan name';
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
