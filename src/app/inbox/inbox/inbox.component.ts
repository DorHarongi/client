import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ActiveContent } from '../models/activeContent.enum';
import { AttackReport } from '../models/attackReport';
import { ClanService } from 'src/app/clan/services/clan.service';
import { BossService } from 'src/app/world-map/services/boss.service';
import { environment } from 'src/environments/environment';

const WINDOW_SIZE = 6;

type ViewMode = 'reports' | 'messages';

interface ResourcesMetadata {
  wood: number;
  stone: number;
  crop: number;
  senderVillageName?: string;
  recipientVillageName?: string;
}

interface TroopsMetadata {
  spearFighters: number;
  swordFighters: number;
  axeFighters: number;
  archers: number;
  magicians: number;
  horsemen: number;
  catapults: number;
  senderVillageName?: string;
  recipientVillageName?: string;
}

interface BossRewardMetadata {
  bossName: string;
  rewardAmount: number;
}

interface Message {
  id: string;
  senderUsername?: string;
  type: string;
  subject: string;
  content: string;
  date: Date;
  read: boolean;
  actionable: boolean;
  metadata?: {
    clanName?: string;
    requestUsername?: string;
    resources?: ResourcesMetadata;
    troops?: TroopsMetadata;
    bossReward?: BossRewardMetadata;
  };
}

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})
export class InboxComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router, 
    private userInformationService: UserInformationService, 
    private http: HttpClient,
    private clanService: ClanService,
    private notificationService: NotificationService,
    private bossService: BossService
  ) { 
    this.username = this.userInformationService.userInformation.username;
  }

  viewMode: ViewMode = 'reports';
  page: number = 1;
  numberOfPages: number = 1;
  displayedPages: number[] = [];
  username: string;
  attackReportsInPage: Array<AttackReport> = [];
  messagesInPage: Array<Message> = [];
  attackReportPopupOpened: boolean = false;
  clickedAttackReport!: AttackReport;
  
  // Message modal
  messageModalOpened: boolean = false;
  selectedMessage: Message | null = null;
  
  subscription1!: Subscription;
  subscription2!: Subscription;
  subscription3!: Subscription;
  subscription4!: Subscription;
  clanRequestError: string = '';
  claimingReward: boolean = false;
  rewardClaimSuccess: boolean = false;

  ngOnDestroy(): void {
    this.subscription1 && this.subscription1.unsubscribe();
    this.subscription2 && this.subscription2.unsubscribe();
    this.subscription3 && this.subscription3.unsubscribe();
    this.subscription4 && this.subscription4.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.page = 1;
    if (this.viewMode === 'reports') {
      this.getNumberOfAttackReportPages();
      this.getAttackReports();
    } else {
      this.getNumberOfMessagePages();
      this.getMessages();
    }
  }

  switchToReports(): void {
    if (this.viewMode !== 'reports') {
      this.viewMode = 'reports';
      this.loadData();
    }
  }

  switchToMessages(): void {
    if (this.viewMode !== 'messages') {
      this.viewMode = 'messages';
      this.loadData();
    }
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

  getNumberOfAttackReportPages(): void
  {
    this.subscription1 = this.http.get<any>(`${environment.apiUrl}/reports/attackReports/${this.username}`, 
    ).subscribe((numberOfPages)=>{
       this.numberOfPages = numberOfPages || 1;
       this.updateDisplayedPages();
   });
  }

  getNumberOfMessagePages(): void
  {
    this.subscription3 = this.http.get<number>(`${environment.apiUrl}/messages/${this.username}/pages?type=messages`)
      .subscribe((numberOfPages)=>{
        this.numberOfPages = numberOfPages || 1;
        this.updateDisplayedPages();
      });
  }

  moveToPage(page: number): void {
    if (page < 1 || page > this.numberOfPages) return; 
    this.page = page;
    if (this.viewMode === 'reports') {
      this.getAttackReports();
    } else {
      this.getMessages();
    }
    this.updateDisplayedPages();
  }

  getAttackReports()
  {
    this.subscription2 = this.http.get<any>(`${environment.apiUrl}/reports/attackReports/${this.username}/${this.page}`, 
     ).subscribe((attackReports)=>{
        this.attackReportsInPage = attackReports;
    });
  }

  getMessages()
  {
    this.subscription4 = this.http.get<Message[]>(`${environment.apiUrl}/messages/${this.username}/page/${this.page}?type=messages`)
      .subscribe((messages)=>{
        this.messagesInPage = messages;
      });
  }

  openAttackReportPopup(clickedAttackReport: AttackReport)
  {
    this.attackReportPopupOpened = true;
    this.clickedAttackReport = clickedAttackReport;
    
    // Mark report as read
    if (!this.isReportRead(clickedAttackReport)) {
      this.markReportAsRead(clickedAttackReport);
    }
  }

  isReportRead(report: AttackReport): boolean {
    // For backward compatibility, treat undefined as read
    return report.read !== false;
  }

  markReportAsRead(report: AttackReport): void {
    this.http.post(`${environment.apiUrl}/reports/read`, {
      reportId: report.id,
      username: this.username
    }).subscribe({
      next: () => {
        report.read = true;
        this.notificationService.notifyItemRead();
      }
    });
  }

  makeAttackReportTitle(attackReport: AttackReport): string
  {
    let title = "";

    if(attackReport.attackerName == this.username)
      title += "You";
    else
      title += attackReport.attackerName
    
    title += ` [${attackReport.attackerVillageName}] attacked `

    if(attackReport.defenderName == this.username)
      title += "you";
    else
      title += attackReport.defenderName

    title += ` [${attackReport.defenderVillageName}].`

    return title;
  }

  getAttackResult(attackReport: AttackReport): string
  {
    if(attackReport.attackerName == this.username)
    {
      if(attackReport.attackerWon)
        return "Win";
      return "Defeat";
    }
    if(attackReport.attackerWon)
        return "Defeat";
    return "Win";
  }

  attackReportPopupClosed(){
    this.attackReportPopupOpened = false;
  }

  handleClanRequest(message: Message, accept: boolean): void {
    if (!message.metadata?.clanName || !message.metadata?.requestUsername) return;
    
    this.clanService.handleJoinRequest(
      message.metadata.clanName,
      this.username,
      message.metadata.requestUsername,
      accept
    ).subscribe({
      next: () => {
        // Send response message is handled by backend
        this.getMessages(); // Refresh
      },
      error: (err) => {
        this.clanRequestError = err.error?.message || 'Failed to handle request';
      }
    });
  }

  getMessageIcon(type: string): string {
    switch(type) {
      case 'clan_join_request':
        return 'assets/population.png';
      case 'clan_request_accepted':
        return 'assets/shield.png';
      case 'clan_request_declined':
        return 'assets/swords.png';
      case 'player_message':
        return 'assets/ancient-scroll.png';
      case 'resources_sent':
      case 'resources_received':
        return 'assets/wood.jpg';
      case 'support_sent':
      case 'support_received':
        return 'assets/spear.png';
      case 'boss_defeated':
        return 'assets/boss-common.png';
      default:
        return 'assets/ancient-scroll.png';
    }
  }

  isResourceMessage(type: string): boolean {
    return type === 'resources_sent' || type === 'resources_received';
  }

  isSupportMessage(type: string): boolean {
    return type === 'support_sent' || type === 'support_received';
  }

  isBossDefeatedMessage(type: string): boolean {
    return type === 'boss_defeated';
  }

  claimBossReward(): void {
    if (this.claimingReward) return;
    
    // Find the index of the pending reward based on boss name
    // We need to match this with the user's pendingBossRewards
    const pendingRewards = this.userInformationService.userInformation.pendingBossRewards || [];
    const bossName = this.selectedMessage?.metadata?.bossReward?.bossName;
    
    // Find the reward index (first matching boss name)
    const rewardIndex = pendingRewards.findIndex(r => r.bossName === bossName);
    
    if (rewardIndex === -1) {
      this.clanRequestError = 'Reward already claimed or not found';
      return;
    }

    this.claimingReward = true;
    this.bossService.claimBossReward(this.username, rewardIndex).subscribe({
      next: (result) => {
        this.claimingReward = false;
        if (result.success) {
          this.rewardClaimSuccess = true;
          // Mark message as non-actionable after claiming
          if (this.selectedMessage) {
            this.selectedMessage.actionable = false;
          }
          // Refresh user info to update resources
          this.userInformationService.refreshUserInformation();
        }
      },
      error: (err) => {
        this.claimingReward = false;
        this.clanRequestError = err.error?.message || 'Failed to claim reward';
      }
    });
  }

  canClaimBossReward(): boolean {
    if (!this.selectedMessage || !this.isBossDefeatedMessage(this.selectedMessage.type)) {
      return false;
    }
    
    const pendingRewards = this.userInformationService.userInformation.pendingBossRewards || [];
    const bossName = this.selectedMessage.metadata?.bossReward?.bossName;
    
    return pendingRewards.some(r => r.bossName === bossName);
  }

  getTotalTroops(troops: TroopsMetadata): number {
    return (troops.spearFighters || 0) + 
           (troops.swordFighters || 0) + 
           (troops.axeFighters || 0) + 
           (troops.archers || 0) + 
           (troops.magicians || 0) + 
           (troops.horsemen || 0) + 
           (troops.catapults || 0);
  }

  openMessageModal(message: Message): void {
    this.selectedMessage = message;
    this.messageModalOpened = true;
    
    // Mark as read if not already
    if (!message.read) {
      this.markMessageAsRead(message);
    }
  }

  closeMessageModal(): void {
    this.messageModalOpened = false;
    this.selectedMessage = null;
    this.rewardClaimSuccess = false;
    this.clanRequestError = '';
  }

  markMessageAsRead(message: Message): void {
    this.http.post(`${environment.apiUrl}/messages/read`, {
      messageId: message.id,
      username: this.username
    }).subscribe({
      next: () => {
        message.read = true;
        this.notificationService.notifyItemRead();
      }
    });
  }

  isMessageRead(message: Message): boolean {
    // For backward compatibility, treat undefined as read
    return message.read !== false;
  }

  getDisplaySubject(message: Message): string {
    // Fix subjects that contain "undefined" due to missing senderUsername
    if (message.subject && message.subject.includes('undefined')) {
      // Use actual senderUsername if available, otherwise 'Unknown'
      const replacement = message.senderUsername || 'Unknown';
      return message.subject.replace('undefined', replacement);
    }
    return message.subject || 'No subject';
  }

  goBack()
  {
    this.router.navigateByUrl('home');
  }

}
