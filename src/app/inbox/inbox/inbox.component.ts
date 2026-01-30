import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ActiveContent } from '../models/activeContent.enum';
import { AttackReport } from '../models/attackReport';
import { ClanService } from 'src/app/clan/services/clan.service';
import { environment } from 'src/environments/environment';

const WINDOW_SIZE = 6;

type ViewMode = 'reports' | 'messages';

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
    private notificationService: NotificationService
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
      default:
        return 'assets/ancient-scroll.png';
    }
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

  goBack()
  {
    this.router.navigateByUrl('home');
  }

}
