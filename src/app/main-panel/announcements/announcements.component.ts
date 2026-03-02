import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface Announcement {
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
  date: string;
}

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss']
})
export class AnnouncementsComponent implements OnInit, OnDestroy {
  announcements: Announcement[] = [];
  private sub?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.sub = timer(0, 30000).pipe(
      switchMap(() => this.http.get<Announcement[]>(`${environment.apiUrl}/announcements/recent`, { params: { limit: '20' } }))
    ).subscribe({
      next: (list) => { this.announcements = list || []; }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** Render content with relic names in gold (simple: wrap **text** in span.gold) */
  formattedContent(content: string): string {
    if (!content) return '';
    return content.replace(/\*\*([^*]+)\*\*/g, '<span class="relic-gold">$1</span>');
  }
}
