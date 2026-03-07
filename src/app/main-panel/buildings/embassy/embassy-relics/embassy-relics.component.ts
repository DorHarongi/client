import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { environment } from 'src/environments/environment';

interface RelicDoc {
  relicId: string;
  holderUsername: string | null;
  holderVillageName: string | null;
  holderClanName: string | null;
  transferCooldownUntil: string | null;
  obtainedAt: string | null;
}

const RELIC_NAMES: Record<string, string> = {
  apple_of_immortality: 'Apple of Immortality',
  eternal_flame: 'Eternal Flame',
  chalice_of_ascension: 'Chalice of Ascension',
  all_seeing_orb: 'All-Seeing Orb',
  sigil_of_creation: 'Sigil of Creation'
};

@Component({
  selector: 'app-embassy-relics',
  templateUrl: './embassy-relics.component.html',
  styleUrls: ['./embassy-relics.component.scss']
})
export class EmbassyRelicsComponent implements OnInit {
  relics: RelicDoc[] = [];
  isLeader = false;
  clanName = '';
  transferRelicId: string | null = null;
  targetUsername = '';
  targetVillageName = '';
  clanMembers: { username: string; villages: { villageName: string }[] }[] = [];
  transferError = '';
  showTransferModal = false;
  today = new Date();

  constructor(
    private http: HttpClient,
    private userInfo: UserInformationService
  ) {}

  ngOnInit(): void {
    this.clanName = this.userInfo.userInformation?.clanName || '';
    const clan = this.userInfo.userInformation?.clanName;
    if (clan) {
      this.http.get<RelicDoc[]>(`${environment.apiUrl}/relics`).subscribe({
        next: (r) => { this.relics = r; }
      });
      this.http.get<any>(`${environment.apiUrl}/clans/${clan}`).subscribe({
        next: (c) => {
          this.isLeader = c.leaderUsername === this.userInfo.userInformation?.username;
          if (c.members) {
            this.clanMembers = c.members.map((m: string) => ({ username: m, villages: [] as { villageName: string }[] }));
          }
        }
      });
    }
  }

  relicName(id: string): string {
    return RELIC_NAMES[id] || id;
  }

  isHeldByMe(r: RelicDoc): boolean {
    return r.holderUsername === this.userInfo.userInformation?.username;
  }

  cooldownActive(r: RelicDoc): boolean {
    return !!(r.transferCooldownUntil && new Date(r.transferCooldownUntil) > new Date());
  }

  canTransfer(r: RelicDoc): boolean {
    if (!r.holderClanName || r.holderClanName !== this.clanName) return false;
    if (this.cooldownActive(r)) return false;
    return this.isLeader;
  }

  openTransfer(relicId: string): void {
    this.transferRelicId = relicId;
    this.targetUsername = '';
    this.targetVillageName = '';
    this.transferError = '';
    this.showTransferModal = true;
  }

  closeTransfer(): void {
    this.showTransferModal = false;
    this.transferRelicId = null;
  }

  confirmTransfer(): void {
    if (!this.transferRelicId || !this.targetUsername || !this.targetVillageName) {
      this.transferError = 'Select a player and village';
      return;
    }
    this.transferError = '';
    this.http.post(`${environment.apiUrl}/relics/transfer`, {
      relicId: this.transferRelicId,
      targetUsername: this.targetUsername,
      targetVillageName: this.targetVillageName
    }).subscribe({
      next: () => {
        this.ngOnInit();
        this.closeTransfer();
      },
      error: (e) => {
        this.transferError = e.error?.message || 'Transfer failed';
      }
    });
  }

  }
