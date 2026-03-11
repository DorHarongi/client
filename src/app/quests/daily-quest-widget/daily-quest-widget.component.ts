import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { TOTAL_QUESTS } from 'utils';
import { DailyQuestService, DailyQuestWithProgress } from '../daily-quest.service';
import { UserInformationService } from '../../user-information/user-information.service';

const POSITION_KEY = 'daily_quest_widget_position';

@Component({
  selector: 'app-daily-quest-widget',
  templateUrl: './daily-quest-widget.component.html',
  styleUrls: ['./daily-quest-widget.component.scss']
})
export class DailyQuestWidgetComponent implements OnInit, OnDestroy {
  showDetails = false;
  quests: DailyQuestWithProgress[] = [];
  isAvailable = false;
  isLoading = true;
  claimingQuestId: string | null = null;

  timeLeft: string = '';

  isDragging = false;
  dragOffset = { x: 0, y: 0 };
  position = { x: 0, y: 0 };

  private subscriptions: Subscription[] = [];
  private timerInterval: any;
  totalQuests = TOTAL_QUESTS;

  constructor(
    private dailyQuestService: DailyQuestService,
    private userInformationService: UserInformationService
  ) {}

  ngOnInit(): void {
    this.loadPosition();
    this.loadQuests();
    this.updateTimeLeft();
    this.timerInterval = setInterval(() => this.updateTimeLeft(), 1000);

    this.subscriptions.push(
      this.userInformationService.villageChanged$.subscribe(() => {
        this.loadQuests();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private updateTimeLeft(): void {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    this.timeLeft = `${hours}h ${minutes}m ${seconds}s`;
  }

  get isVisible(): boolean {
    const user = this.userInformationService.userInformation;
    if (!user) return false;
    const currentIndex = user.currentQuestIndex ?? 1;
    return currentIndex > this.totalQuests;
  }

  get hasAnyClaimable(): boolean {
    return this.quests.some(
      q => !q.claimed && q.progress >= q.quest.target
    );
  }

  isQuestClaimable(quest: DailyQuestWithProgress): boolean {
    return !quest.claimed && quest.progress >= quest.quest.target;
  }

  loadQuests(): void {
    if (!this.isVisible) {
      this.isLoading = false;
      return;
    }
    if (this.quests.length === 0) {
      this.isLoading = true;
    }
    this.dailyQuestService.getTodaysQuests().subscribe({
      next: (response) => {
        this.quests = response.quests || [];
        this.isAvailable = response.isAvailable;
        this.isLoading = false;
      },
      error: () => {
        this.quests = [];
        this.isAvailable = false;
        this.isLoading = false;
      }
    });
  }

  claimQuest(quest: DailyQuestWithProgress, event: Event): void {
    event.stopPropagation();
    if (quest.claimed || quest.progress < quest.quest.target || this.claimingQuestId) return;

    const user = this.userInformationService.userInformation;
    if (!user) return;

    const villageIndex = this.userInformationService.currentVillageIndex ?? 0;
    this.claimingQuestId = quest.quest.id;

    this.dailyQuestService.claimDailyQuest(quest.quest.id, villageIndex).subscribe({
      next: (response) => {
        this.claimingQuestId = null;
        if (response.user) {
          this.userInformationService.setUserInformation(response.user);
        }
        this.loadQuests();
      },
      error: () => {
        this.claimingQuestId = null;
      }
    });
  }

  toggleDetails(): void {
    if (!this.isDragging) {
      this.showDetails = !this.showDetails;
    }
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
    const rect = (event.target as HTMLElement).closest('.daily-quest-widget')?.getBoundingClientRect();
    if (rect) {
      this.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }
  }

  private updateDragPosition(clientX: number, clientY: number): void {
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
    const questWidgetPos = localStorage.getItem('quest_widget_position');
    let baseX = window.innerWidth - 300;
    let baseY = 100;
    if (questWidgetPos) {
      try {
        const parsed = JSON.parse(questWidgetPos);
        baseX = parsed.x - 280;
        baseY = parsed.y;
      } catch { /* use defaults */ }
    }
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      this.position = {
        x: Math.max(0, window.innerWidth - 230 - 230),
        y: 160
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
