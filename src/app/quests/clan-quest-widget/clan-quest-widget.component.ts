import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { TOTAL_QUESTS } from 'utils';
import {
  ClanQuestService,
  ClanQuestStatusResponse
} from '../clan-quest.service';
import { UserInformationService } from '../../user-information/user-information.service';

const POSITION_KEY = 'clan_quest_widget_position';

@Component({
  selector: 'app-clan-quest-widget',
  templateUrl: './clan-quest-widget.component.html',
  styleUrls: ['./clan-quest-widget.component.scss']
})
export class ClanQuestWidgetComponent implements OnInit, OnDestroy {
  showDetails = false;
  status: ClanQuestStatusResponse | null = null;
  isLoading = true;
  isClaiming = false;

  timeLeft: string = '';

  isDragging = false;
  private hasMoved = false;
  private wasDragging = false;
  dragOffset = { x: 0, y: 0 };
  position = { x: 0, y: 0 };

  private subscriptions: Subscription[] = [];
  private timerInterval: any;
  totalQuests = TOTAL_QUESTS;

  constructor(
    private clanQuestService: ClanQuestService,
    private userInformationService: UserInformationService
  ) {}

  ngOnInit(): void {
    this.loadPosition();
    this.loadStatus();
    this.updateTimeLeft();
    this.timerInterval = setInterval(() => this.updateTimeLeft(), 1000);

    this.subscriptions.push(
      this.userInformationService.villageChanged$.subscribe(() => {
        this.loadStatus();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private updateTimeLeft(): void {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday
    ));
    const diff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    this.timeLeft = days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`;
  }

  get isVisible(): boolean {
    const user = this.userInformationService.userInformation;
    if (!user) return false;
    const inClan = !!(user.clanName && user.clanName.trim() !== '');
    const currentIndex = user.currentQuestIndex ?? 1;
    return inClan && currentIndex > this.totalQuests;
  }

  get progress(): number {
    return this.status?.clanProgress?.progress ?? 0;
  }

  get target(): number {
    return this.status?.quest?.target ?? 0;
  }

  get contributions(): { username: string; amount: number }[] {
    return this.status?.clanProgress?.contributions ?? [];
  }

  getClampedProgress(): number {
    return Math.max(0, this.progress);
  }

  loadStatus(): void {
    if (!this.isVisible) {
      this.isLoading = false;
      return;
    }
    if (!this.status) {
      this.isLoading = true;
    }
    this.clanQuestService.getClanQuestStatus().subscribe({
      next: (response) => {
        this.status = response;
        this.isLoading = false;
      },
      error: () => {
        this.status = null;
        this.isLoading = false;
      }
    });
  }

  claimReward(event: Event): void {
    event.stopPropagation();
    if (!this.status?.canClaim || this.isClaiming) return;

    const villageIndex = this.userInformationService.currentVillageIndex ?? 0;
    this.isClaiming = true;

    this.clanQuestService.claimClanQuestReward(villageIndex).subscribe({
      next: (response) => {
        this.isClaiming = false;
        if (response.user) {
          this.userInformationService.setUserInformation(response.user);
        }
        this.loadStatus();
      },
      error: () => {
        this.isClaiming = false;
      }
    });
  }

  toggleDetails(): void {
    if (this.wasDragging) {
      return;
    }
    this.showDetails = !this.showDetails;
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    this.startDrag(event.clientX, event.clientY, event);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.updateDragPosition(event.clientX, event.clientY);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.endDrag();
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY, event);
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    const touch = event.touches[0];
    this.updateDragPosition(touch.clientX, touch.clientY);
    event.preventDefault();
  }

  @HostListener('document:touchend')
  onTouchEnd(): void {
    this.endDrag();
  }

  private startDrag(clientX: number, clientY: number, event: Event): void {
    this.isDragging = true;
    this.hasMoved = false;
    const rect = (event.target as HTMLElement).closest('.clan-quest-widget')?.getBoundingClientRect();
    if (rect) {
      this.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }
  }

  private updateDragPosition(clientX: number, clientY: number): void {
    this.hasMoved = true;
    const newX = clientX - this.dragOffset.x;
    const newY = clientY - this.dragOffset.y;
    const maxX = window.innerWidth - 280;
    const maxY = window.innerHeight - 80;
    this.position = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };
  }

  private endDrag(): void {
    if (this.isDragging) {
      if (this.hasMoved) {
        this.wasDragging = true;
        setTimeout(() => this.wasDragging = false, 0);
      }
      this.isDragging = false;
      this.savePosition();
    }
  }

  private loadPosition(): void {
    try {
      const saved = localStorage.getItem(POSITION_KEY);
      if (saved) {
        const savedPos = JSON.parse(saved);
        const maxX = window.innerWidth - 280;
        const maxY = window.innerHeight - 80;
        this.position = {
          x: Math.max(0, Math.min(savedPos.x, maxX)),
          y: Math.max(0, Math.min(savedPos.y, maxY))
        };
      } else {
        this.setDefaultPosition();
      }
    } catch {
      this.setDefaultPosition();
    }
  }

  private setDefaultPosition(): void {
    const dailyPos = localStorage.getItem('daily_quest_widget_position');
    let baseX = window.innerWidth - 580;
    let baseY = 100;
    if (dailyPos) {
      try {
        const parsed = JSON.parse(dailyPos);
        baseX = parsed.x - 280;
        baseY = parsed.y;
      } catch { /* use defaults */ }
    }
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      this.position = {
        x: Math.max(0, window.innerWidth - 230 - 230 - 230),
        y: 240
      };
    } else {
      this.position = {
        x: Math.max(0, baseX),
        y: baseY
      };
    }
  }

  private savePosition(): void {
    localStorage.setItem(POSITION_KEY, JSON.stringify(this.position));
  }
}
