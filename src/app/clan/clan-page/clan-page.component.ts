import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { environment } from 'src/environments/environment';
import { MAX_CLAN_MEMBERS, embassyMinimumLevelForClanJoin } from 'utils';
import {
  ClanDTO,
  ClanMemberRaidStatsDTO,
  ClanService,
} from '../services/clan.service';

interface RelicDoc {
  relicId: string;
  holderUsername: string | null;
  holderVillageName: string | null;
  holderClanName: string | null;
  transferCooldownUntil: string | null;
}

// Measured pixel centers of each relic on the 640x427 canvas
const RELIC_CENTERS: { id: string; x: number; y: number }[] = [
  { id: 'eternal_flame', x: 318, y: 109 },
  { id: 'chalice_of_ascension', x: 422, y: 146 },
  { id: 'sigil_of_creation', x: 427, y: 240 },
  { id: 'all_seeing_orb', x: 210, y: 239 },
  { id: 'apple_of_immortality', x: 215, y: 139 },
];
const RELIC_DISPLAY_NAMES: Record<string, string> = {
  apple_of_immortality: 'Apple of Immortality',
  eternal_flame: 'Eternal Flame',
  chalice_of_ascension: 'Chalice of Ascension',
  all_seeing_orb: 'All-Seeing Orb',
  sigil_of_creation: 'Sigil of Creation',
};

@Component({
  selector: 'app-clan-page',
  templateUrl: './clan-page.component.html',
  styleUrls: ['./clan-page.component.scss'],
})
export class ClanPageComponent implements OnInit, OnDestroy {
  @ViewChild('relicCanvas') relicCanvasRef!: ElementRef<HTMLCanvasElement>;

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

  successMessage: string = '';
  errorMessage: string = '';

  editingClanName: boolean = false;
  newClanName: string = '';

  editingDescription: boolean = false;
  newDescription: string = '';

  memberRaidStats: ClanMemberRaidStatsDTO[] = [];
  memberStatsLoaded: boolean = false;

  // Confirmation dialogs
  showLeaveConfirm = false;
  leaveIsDeleting = false;
  leaveNewLeader = '';

  showKickConfirm = false;
  pendingKickUsername = '';
  kickConfirmMessage = '';

  // Relics
  relics: RelicDoc[] = [];
  clanRelics: RelicDoc[] = [];
  showRelicTransfer: boolean = false;
  selectedRelicId: string = '';
  transferTargetUser: string = '';
  transferTargetVillage: string = '';
  relicError: string = '';
  transferPlayerVillages: { villageName: string; population: number }[] = [];
  loadingVillages: boolean = false;

  subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clanService: ClanService,
    private userInformationService: UserInformationService,
    private http: HttpClient
  ) {
    this.currentUsername = this.userInformationService.userInformation.username;
    this.currentUserClan =
      this.userInformationService.userInformation.clanName || '';
  }

  ngOnInit(): void {
    // Refresh username in case user info was loaded after component constructed
    this.currentUsername =
      this.userInformationService.userInformation?.username || '';
    this.currentUserClan =
      this.userInformationService.userInformation?.clanName || '';

    this.route.params.subscribe((params) => {
      this.clanName = params['clanName'];
      this.loadClanInfo();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadClanInfo(): void {
    this.loading = true;
    this.subscription = this.clanService.getClan(this.clanName).subscribe({
      next: (clan) => {
        this.clanInfo = clan;
        this.loading = false;
        this.isLeader = clan.leaderUsername === this.currentUsername;
        this.isMember = clan.members.includes(this.currentUsername);
        this.hasAlreadyRequested =
          this.userInformationService.userInformation.pendingClanRequests?.includes(
            this.clanName
          ) || false;

        this.loadMemberRaidStats();
        this.loadRelics();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadMemberRaidStats(): void {
    this.memberStatsLoaded = false;
    this.clanService.getClanMemberRaidStats(this.clanName).subscribe({
      next: (stats) => {
        this.memberRaidStats = stats;
        this.memberStatsLoaded = true;
      },
      error: () => {
        this.memberRaidStats = [];
        this.memberStatsLoaded = true;
      },
    });
  }

  get sortedMembers(): string[] {
    if (this.memberRaidStats.length > 0) {
      return this.memberRaidStats.map((s) => s.username);
    }
    return this.clanInfo?.members || [];
  }

  getMemberRaidDamage(username: string): number {
    const stat = this.memberRaidStats.find((s) => s.username === username);
    return stat?.weeklyRaidDamage || 0;
  }

  getMemberPopulation(username: string): number {
    const stat = this.memberRaidStats.find((s) => s.username === username);
    return stat?.totalPopulation || 0;
  }

  formatDamage(damage: number): string {
    if (damage >= 1000000) {
      return (damage / 1000000).toFixed(1) + 'M';
    } else if (damage >= 1000) {
      return (damage / 1000).toFixed(1) + 'K';
    }
    return damage.toString();
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
      this.currentUsername =
        this.userInformationService.userInformation?.username;
    }

    if (!this.currentUsername) {
      this.errorMessage = 'User session expired. Please refresh the page.';
      return;
    }

    this.clanService
      .requestToJoinClan(this.clanName, this.currentUsername, this.joinMessage)
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
            setTimeout(() => (this.successMessage = ''), 3000);
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to join clan';
        },
      });
  }

  leaveClan(): void {
    this.leaveIsDeleting =
      this.isLeader && this.clanInfo?.members.length === 1;
    this.leaveNewLeader = '';
    this.showLeaveConfirm = true;
  }

  confirmLeave(): void {
    this.showLeaveConfirm = false;
    const newLeader = this.leaveNewLeader || undefined;
    this.clanService
      .leaveClan(this.clanName, this.currentUsername, newLeader)
      .subscribe({
        next: () => {
          this.userInformationService.updateUser();
          if (this.leaveIsDeleting) {
            this.router.navigate(['home']);
          } else {
            this.loadClanInfo();
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to leave clan';
        },
      });
  }

  cancelLeave(): void {
    this.showLeaveConfirm = false;
  }

  handleJoinRequest(requestUsername: string, accept: boolean): void {
    this.clanService
      .handleJoinRequest(
        this.clanName,
        this.currentUsername,
        requestUsername,
        accept
      )
      .subscribe({
        next: () => {
          this.loadClanInfo();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to handle request';
        },
      });
  }

  kickMember(memberUsername: string): void {
    const memberRelics = this.getMemberRelics(memberUsername);
    this.pendingKickUsername = memberUsername;

    if (memberRelics.length > 0) {
      const relicList = memberRelics.join(' and ');
      this.kickConfirmMessage =
        `${memberUsername} holds the ${relicList}. ` +
        `Kicking them will forfeit your clan's control over ${memberRelics.length > 1 ? 'these relics' : 'this relic'}.`;
    } else {
      this.kickConfirmMessage = '';
    }

    this.showKickConfirm = true;
  }

  confirmKick(): void {
    this.showKickConfirm = false;
    this.clanService
      .kickMember(this.clanName, this.currentUsername, this.pendingKickUsername)
      .subscribe({
        next: () => {
          this.successMessage = `${this.pendingKickUsername} has been kicked from the clan`;
          setTimeout(() => (this.successMessage = ''), 3000);
          this.loadClanInfo();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to kick member';
        },
      });
  }

  cancelKick(): void {
    this.showKickConfirm = false;
    this.pendingKickUsername = '';
    this.kickConfirmMessage = '';
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

    this.clanService
      .updateClanName(
        this.clanName,
        this.newClanName.trim(),
        this.currentUsername
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Clan name updated successfully!';
          this.userInformationService.updateUser();
          // Navigate to the new clan page
          this.router.navigate(['clan', this.newClanName.trim()]);
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || 'Failed to update clan name';
        },
      });
  }

  // Clan description editing
  startEditingDescription(): void {
    this.editingDescription = true;
    this.newDescription = this.clanInfo?.description || '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEditingDescription(): void {
    this.editingDescription = false;
    this.newDescription = '';
  }

  saveDescription(): void {
    this.clanService
      .updateClanDescription(
        this.clanName,
        this.newDescription.trim(),
        this.currentUsername
      )
      .subscribe({
        next: () => {
          if (this.clanInfo) {
            this.clanInfo.description = this.newDescription.trim();
          }
          this.editingDescription = false;
          this.successMessage = 'Description updated!';
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || 'Failed to update description';
        },
      });
  }

  toggleClanOpen(): void {
    if (!this.clanInfo) return;

    const newStatus = !this.clanInfo.isOpen;
    this.clanService
      .toggleClanOpen(this.clanName, this.currentUsername, newStatus)
      .subscribe({
        next: () => {
          this.clanInfo!.isOpen = newStatus;
          this.successMessage = `Clan is now ${newStatus ? 'open' : 'closed'}`;
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || 'Failed to update clan status';
        },
      });
  }

  isClanFull(): boolean {
    return (this.clanInfo?.members?.length ?? 0) >= MAX_CLAN_MEMBERS;
  }

  canJoin(): boolean {
    const hasEmbassy = this.userInformationService.userInformation.villages?.some(
      (v: any) => v.buildingsLevels?.embassyLevel >= embassyMinimumLevelForClanJoin,
    );
    return (
      !this.isMember &&
      !this.currentUserClan &&
      !this.hasAlreadyRequested &&
      !this.isClanFull() &&
      !!hasEmbassy
    );
  }

  goBack(): void {
    this.router.navigateByUrl('Statistics');
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  // ========== RELICS ==========

  loadRelics(): void {
    this.http.get<RelicDoc[]>(`${environment.apiUrl}/relics`).subscribe({
      next: (all) => {
        this.relics = all;
        this.clanRelics = all.filter((r) => r.holderClanName === this.clanName);
        setTimeout(() => this.drawRelicImage(), 100);
      },
    });
  }

  getRelicName(id: string): string {
    return RELIC_DISPLAY_NAMES[id] || id;
  }

  isClanRelic(id: string): boolean {
    return this.clanRelics.some((r) => r.relicId === id);
  }

  getRelicHolder(id: string): RelicDoc | undefined {
    return this.relics.find((r) => r.relicId === id);
  }

  getMemberRelics(username: string): string[] {
    return this.relics
      .filter(
        (r) =>
          r.holderUsername === username && r.holderClanName === this.clanName
      )
      .map((r) => this.getRelicName(r.relicId));
  }

  onRelicClick(relicId: string): void {
    const relic = this.getRelicHolder(relicId);
    if (!relic || relic.holderClanName !== this.clanName) return;

    if (this.isLeader) {
      this.selectedRelicId = relicId;
      this.transferTargetUser = '';
      this.transferTargetVillage = '';
      this.relicError = '';
      this.transferPlayerVillages = [];
      this.showRelicTransfer = true;
    }
  }

  onTransferPlayerChange(): void {
    this.transferTargetVillage = '';
    this.transferPlayerVillages = [];
    if (!this.transferTargetUser) return;
    this.loadingVillages = true;
    this.http
      .get<any>(
        `${environment.apiUrl}/users/profile/${this.transferTargetUser}`
      )
      .subscribe({
        next: (user) => {
          this.transferPlayerVillages = (user.villages || []).map((v: any) => ({
            villageName: v.villageName,
            population: v.population || 0,
          }));
          this.loadingVillages = false;
        },
        error: () => {
          this.transferPlayerVillages = [];
          this.loadingVillages = false;
        },
      });
  }

  confirmRelicTransfer(): void {
    if (!this.transferTargetUser || !this.transferTargetVillage) {
      this.relicError = 'Select a player and a village';
      return;
    }
    this.http
      .post(`${environment.apiUrl}/relics/transfer`, {
        relicId: this.selectedRelicId,
        targetUsername: this.transferTargetUser,
        targetVillageName: this.transferTargetVillage,
      })
      .subscribe({
        next: () => {
          this.showRelicTransfer = false;
          this.loadRelics();
        },
        error: (e) => {
          this.relicError = e.error?.message || 'Transfer failed';
        },
      });
  }

  cancelRelicTransfer(): void {
    this.showRelicTransfer = false;
  }

  private drawRelicImage(): void {
    const canvas = this.relicCanvasRef?.nativeElement;
    if (!canvas) return;

    const heldIds = new Set(this.clanRelics.map((r) => r.relicId));

    const allImg = new Image();
    const noImg = new Image();
    let loaded = 0;

    const onLoad = () => {
      loaded++;
      if (loaded < 2) return;

      const w = 640;
      const h = 427;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      const offAll = document.createElement('canvas');
      offAll.width = w;
      offAll.height = h;
      offAll.getContext('2d')!.drawImage(allImg, 0, 0, w, h);
      const allData = offAll.getContext('2d')!.getImageData(0, 0, w, h);

      const offNo = document.createElement('canvas');
      offNo.width = w;
      offNo.height = h;
      offNo.getContext('2d')!.drawImage(noImg, 0, 0, w, h);
      const noData = offNo.getContext('2d')!.getImageData(0, 0, w, h);

      // Pre-compute which source image to use per relic center
      const centerSources = RELIC_CENTERS.map((c) => heldIds.has(c.id));

      const result = ctx.createImageData(w, h);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          // Voronoi: find nearest relic center
          let minDist = Infinity;
          let nearestIdx = 0;
          for (let i = 0; i < RELIC_CENTERS.length; i++) {
            const dx = x - RELIC_CENTERS[i].x;
            const dy = y - RELIC_CENTERS[i].y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
              minDist = dist;
              nearestIdx = i;
            }
          }

          const idx = (y * w + x) * 4;
          const src = centerSources[nearestIdx] ? allData : noData;
          result.data[idx] = src.data[idx];
          result.data[idx + 1] = src.data[idx + 1];
          result.data[idx + 2] = src.data[idx + 2];
          result.data[idx + 3] = src.data[idx + 3];
        }
      }

      ctx.putImageData(result, 0, 0);
    };

    allImg.onload = onLoad;
    noImg.onload = onLoad;
    allImg.src = 'assets/all-relics.png';
    noImg.src = 'assets/no-relics.png';
  }
}
