import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { VillageOnMap } from 'src/app/world-map/models/mapModels';
import { environment } from 'src/environments/environment';

const MAX_MESSAGE_LENGTH = 100;
const MAX_INTRO_LENGTH = 200;

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
  
  // Message sending
  showMessageForm: boolean = false;
  messageContent: string = '';
  messageSending: boolean = false;
  messageSuccess: string = '';
  messageError: string = '';
  maxMessageLength = MAX_MESSAGE_LENGTH;

  // Intro editing
  editingIntro: boolean = false;
  introContent: string = '';
  introSaving: boolean = false;
  introSuccess: string = '';
  introError: string = '';
  maxIntroLength = MAX_INTRO_LENGTH;

  // Village interaction
  selectedVillage: VillageOnMap | null = null;

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

  openVillageInteraction(village: any): void {
    if (this.isOwnProfile) return;
    
    // Convert to VillageOnMap format
    this.selectedVillage = {
      x: village.location?.x || 0,
      y: village.location?.y || 0,
      ownerUsername: this.playerInfo.username,
      villageName: village.villageName,
      clanName: this.playerInfo.clanName
    };
  }

  closeVillageInteraction(): void {
    this.selectedVillage = null;
  }

  // Intro editing
  startEditingIntro(): void {
    this.editingIntro = true;
    this.introContent = this.playerInfo?.intro || '';
    this.introSuccess = '';
    this.introError = '';
  }

  cancelEditingIntro(): void {
    this.editingIntro = false;
    this.introContent = '';
    this.introSuccess = '';
    this.introError = '';
  }

  saveIntro(): void {
    if (this.introContent.length > MAX_INTRO_LENGTH) {
      this.introError = `Intro cannot exceed ${MAX_INTRO_LENGTH} characters`;
      return;
    }

    this.introSaving = true;
    this.introError = '';

    this.http.post(`${environment.apiUrl}/users/update-intro`, {
      username: this.currentUsername,
      intro: this.introContent.trim()
    }).subscribe({
      next: () => {
        this.introSaving = false;
        this.introSuccess = 'Intro updated successfully!';
        this.playerInfo.intro = this.introContent.trim();
        setTimeout(() => {
          this.introSuccess = '';
          this.editingIntro = false;
        }, 1500);
      },
      error: (err) => {
        this.introSaving = false;
        this.introError = err.error?.message || 'Failed to update intro';
      }
    });
  }
}
