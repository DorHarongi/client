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
import { getBossImageByName, warehouseStorageByLevel } from 'utils';

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
  rewardId?: string; // Unique ID to match with pending reward
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
  
  // Unread counts for badges
  unreadReportsCount: number = 0;
  unreadMessagesCount: number = 0;

  ngOnDestroy(): void {
    this.subscription1 && this.subscription1.unsubscribe();
    this.subscription2 && this.subscription2.unsubscribe();
    this.subscription3 && this.subscription3.unsubscribe();
    this.subscription4 && this.subscription4.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadUnreadCounts();
  }
  
  loadUnreadCounts(): void {
    // Get unread battle reports count
    this.http.get<number>(`${environment.apiUrl}/reports/unread/${this.username}`)
      .subscribe(count => this.unreadReportsCount = count);
    
    // Get unread messages count
    this.http.get<number>(`${environment.apiUrl}/messages/${this.username}/unread`)
      .subscribe(count => this.unreadMessagesCount = count);
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
      this.loadUnreadCounts();
    }
  }

  switchToMessages(): void {
    if (this.viewMode !== 'messages') {
      this.viewMode = 'messages';
      this.loadData();
      this.loadUnreadCounts();
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
        // Immediately update unread counts
        this.loadUnreadCounts();
      }
    });
  }

  makeAttackReportTitle(attackReport: AttackReport): string
  {
    if (attackReport.reportType === 'spy') {
      const isAttacker = attackReport.attackerName === this.username;
      if (isAttacker) {
        if (attackReport.attackerWon) {
          return `You scouted ${attackReport.defenderName} [${attackReport.defenderVillageName}]`;
        }
        return `Your scout to ${attackReport.defenderName} [${attackReport.defenderVillageName}] has been caught`;
      }
      return `${attackReport.attackerName} [${attackReport.attackerVillageName}] tried to scout you`;
    }

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
    if (attackReport.reportType === 'spy') {
      if (attackReport.attackerWon) return 'Success';
      const isAttacker = attackReport.attackerName === this.username;
      return isAttacker ? 'Caught' : 'Intercepted';
    }
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

  getMessageIcon(message: Message): string {
    switch(message.type) {
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
      case 'support_withdrawn':
        return 'assets/spear.png';
      case 'boss_defeated':
        return 'assets/' + getBossImageByName(message.metadata?.bossReward?.bossName);
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
    
    const rewardId = this.selectedMessage?.metadata?.bossReward?.rewardId;
    if (!rewardId || !this.canClaimBossReward()) {
      this.clanRequestError = 'Reward already claimed or not found';
      return;
    }

    this.claimingReward = true;
    this.bossService.claimBossReward(this.username, rewardId).subscribe({
      next: (result) => {
        this.claimingReward = false;
        if (result.success) {
          this.rewardClaimSuccess = true;
          if (this.selectedMessage) {
            this.selectedMessage.actionable = false;
          }
          this.userInformationService.refreshUserInformation();
        }
      },
      error: (err) => {
        this.claimingReward = false;
        this.clanRequestError = err.error?.message || 'Failed to claim reward';
      }
    });
  }

  areAllWarehousesFull(): boolean {
    const village = this.userInformationService.currentVillage;
    if (!village) return false;
    const maxWood = warehouseStorageByLevel[village.buildingsLevels.woodWarehouseLevel];
    const maxStone = warehouseStorageByLevel[village.buildingsLevels.stoneWarehouseLevel];
    const maxCrop = warehouseStorageByLevel[village.buildingsLevels.cropWarehouseLevel];
    return village.resourcesAmounts.woodAmount >= maxWood
        && village.resourcesAmounts.stonesAmount >= maxStone
        && village.resourcesAmounts.cropAmount >= maxCrop;
  }

  canClaimBossReward(): boolean {
    if (!this.selectedMessage || !this.isBossDefeatedMessage(this.selectedMessage.type)) {
      return false;
    }
    if (this.areAllWarehousesFull()) return false;
    
    const pendingRewards = this.userInformationService.userInformation.pendingBossRewards || [];
    const rewardId = this.selectedMessage.metadata?.bossReward?.rewardId;
    return pendingRewards.some(r => r.rewardId === rewardId);
  }

  canClaimBossRewardForMessage(message: Message): boolean {
    if (!message || !this.isBossDefeatedMessage(message.type)) {
      return false;
    }
    if (this.areAllWarehousesFull()) return false;
    
    const pendingRewards = this.userInformationService.userInformation.pendingBossRewards || [];
    const rewardId = message.metadata?.bossReward?.rewardId;
    return pendingRewards.some(r => r.rewardId === rewardId);
  }

  claimBossRewardFromTable(message: Message): void {
    if (this.claimingReward) return;
    
    const rewardId = message.metadata?.bossReward?.rewardId;
    if (!rewardId) return;

    this.claimingReward = true;
    this.bossService.claimBossReward(this.username, rewardId).subscribe({
      next: (result) => {
        this.claimingReward = false;
        if (result.success) {
          message.actionable = false;
          if (!message.read) {
            this.markMessageAsRead(message);
          }
          this.userInformationService.refreshUserInformation();
          this.loadUnreadCounts();
        }
      },
      error: () => {
        this.claimingReward = false;
      }
    });
  }

  // Check if message has any available actions
  hasActions(message: Message): boolean {
    if (!message.actionable) return false;
    
    if (message.type === 'clan_join_request') return true;
    if (this.isBossDefeatedMessage(message.type) && this.canClaimBossRewardForMessage(message)) return true;
    
    return false;
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
        // Immediately update unread counts
        this.loadUnreadCounts();
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
