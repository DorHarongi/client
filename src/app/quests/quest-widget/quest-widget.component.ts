import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { Quest, QuestCompletionResult, TOTAL_QUESTS } from 'utils';
import { QuestService } from '../quest.service';
import { UserInformationService } from '../../user-information/user-information.service';

const POSITION_KEY = 'quest_widget_position';

@Component({
  selector: 'app-quest-widget',
  templateUrl: './quest-widget.component.html',
  styleUrls: ['./quest-widget.component.scss']
})
export class QuestWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('widget') widgetRef!: ElementRef;

  currentQuest: Quest | null = null;
  showDetails: boolean = false;
  showCompletionModal: boolean = false;
  completedQuest: QuestCompletionResult | null = null;

  // Dragging state
  isDragging: boolean = false;
  dragOffset = { x: 0, y: 0 };
  position = { x: 0, y: 0 };

  private subscriptions: Subscription[] = [];
  totalQuests = TOTAL_QUESTS;

  constructor(
    private questService: QuestService,
    private userInformationService: UserInformationService
  ) {}

  ngOnInit(): void {
    this.loadPosition();
    this.updateCurrentQuest();

    // Subscribe to village changes to update quest
    this.subscriptions.push(
      this.userInformationService.villageChanged$.subscribe(() => {
        this.updateCurrentQuest();
      })
    );

    // Subscribe to quest completion events
    this.subscriptions.push(
      this.questService.onQuestCompleted$.subscribe((result) => {
        this.handleQuestCompleted(result);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get isVisible(): boolean {
    const user = this.userInformationService.userInformation;
    if (!user) return false;
    return this.questService.areQuestsAvailable(
      user.currentQuestIndex || 1,
      user.villages?.length || 0
    );
  }

  get questProgress(): string {
    const user = this.userInformationService.userInformation;
    const index = user?.currentQuestIndex || 1;
    return `${index}/${this.totalQuests}`;
  }

  updateCurrentQuest(): void {
    const user = this.userInformationService.userInformation;
    if (user) {
      this.currentQuest = this.questService.getCurrentQuest(user.currentQuestIndex || 1);
    }
  }

  handleQuestCompleted(result: QuestCompletionResult): void {
    this.completedQuest = result;
    this.showCompletionModal = true;
    this.showDetails = false;
    // Quest will update after modal is closed
  }

  closeCompletionModal(): void {
    this.showCompletionModal = false;
    this.completedQuest = null;
    this.updateCurrentQuest();
  }

  toggleDetails(): void {
    if (!this.isDragging) {
      this.showDetails = !this.showDetails;
    }
  }

  // Dragging functionality
  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // Only left click
    
    this.isDragging = true;
    const rect = (event.target as HTMLElement).closest('.quest-widget')?.getBoundingClientRect();
    if (rect) {
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const newX = event.clientX - this.dragOffset.x;
    const newY = event.clientY - this.dragOffset.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - 280;
    const maxY = window.innerHeight - 80;

    this.position = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.savePosition();
    }
  }

  private loadPosition(): void {
    try {
      const saved = localStorage.getItem(POSITION_KEY);
      if (saved) {
        this.position = JSON.parse(saved);
      } else {
        // Default position: bottom-right corner
        this.position = {
          x: window.innerWidth - 300,
          y: window.innerHeight - 120
        };
      }
    } catch {
      this.position = { x: window.innerWidth - 300, y: window.innerHeight - 120 };
    }
  }

  private savePosition(): void {
    localStorage.setItem(POSITION_KEY, JSON.stringify(this.position));
  }
}
