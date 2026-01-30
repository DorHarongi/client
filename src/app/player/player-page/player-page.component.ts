import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-player-page',
  templateUrl: './player-page.component.html',
  styleUrls: ['./player-page.component.scss']
})
const MAX_MESSAGE_LENGTH = 100;

export class PlayerPageComponent implements OnInit, OnDestroy {

  username: string = '';
  playerInfo: any;
  loading: boolean = true;
  isOwnProfile: boolean = false;
  isSameClan: boolean = false;
  currentUsername: string;
  
  // Message sending
  showMessageForm: boolean = false;
  messageContent: string = '';
  messageSending: boolean = false;
  messageSuccess: string = '';
  messageError: string = '';
  maxMessageLength = MAX_MESSAGE_LENGTH;

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
    this.subscription = this.http.get<any>(`${environment.apiUrl}/users/profile/${this.username}`)
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

  toggleMessageForm(): void {
    this.showMessageForm = !this.showMessageForm;
    this.messageContent = '';
    this.messageSuccess = '';
    this.messageError = '';
  }

  sendMessage(): void {
    if (!this.messageContent.trim()) {
      this.messageError = 'Please enter a message';
      return;
    }

    if (this.messageContent.length > MAX_MESSAGE_LENGTH) {
      this.messageError = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`;
      return;
    }

    this.messageSending = true;
    this.messageError = '';

    this.http.post(`${environment.apiUrl}/messages/send`, {
      senderUsername: this.currentUsername,
      recipientUsername: this.username,
      content: this.messageContent.trim()
    }).subscribe({
      next: () => {
        this.messageSending = false;
        this.messageSuccess = 'Message sent successfully!';
        this.messageContent = '';
        setTimeout(() => {
          this.messageSuccess = '';
          this.showMessageForm = false;
        }, 2000);
      },
      error: (err) => {
        this.messageSending = false;
        this.messageError = err.error?.message || 'Failed to send message';
      }
    });
  }
}
