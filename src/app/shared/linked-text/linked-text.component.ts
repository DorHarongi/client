import { Component, Input, OnChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

export type SegmentType = 'text' | 'player' | 'village' | 'coords' | 'clan' | 'oasis' | 'boss';

export interface TextSegment {
  type: SegmentType;
  display: string;
  value?: string;
  x?: number;
  y?: number;
  entityId?: string;
  active: boolean;
}

const LINK_REGEX = /\{(player|village|coords|clan|oasis|boss):([^}]+)\}/g;

function parseLinkedText(raw: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  raw.replace(LINK_REGEX, (match, type, payload, offset) => {
    if (offset > lastIndex) {
      segments.push({ type: 'text', display: raw.slice(lastIndex, offset), active: false });
    }

    const parts = payload.split('|');
    switch (type) {
      case 'player':
        segments.push({ type: 'player', display: parts[0], value: parts[0], active: true });
        break;
      case 'village':
        segments.push({ type: 'village', display: parts[0], x: Number(parts[1]), y: Number(parts[2]), active: true });
        break;
      case 'coords':
        segments.push({ type: 'coords', display: `(${parts[0]}, ${parts[1]})`, x: Number(parts[0]), y: Number(parts[1]), active: true });
        break;
      case 'clan':
        segments.push({ type: 'clan', display: parts[0], value: parts[0], active: true });
        break;
      case 'oasis':
        segments.push({ type: 'oasis', display: parts[0], x: Number(parts[1]), y: Number(parts[2]), entityId: parts[3], active: true });
        break;
      case 'boss':
        segments.push({ type: 'boss', display: parts[0], x: Number(parts[1]), y: Number(parts[2]), entityId: parts[3], active: true });
        break;
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < raw.length) {
    segments.push({ type: 'text', display: raw.slice(lastIndex), active: false });
  }

  return segments;
}

@Component({
  selector: 'app-linked-text',
  template: `
    <ng-container *ngFor="let seg of segments">
      <span *ngIf="seg.type === 'text'">{{ seg.display }}</span>
      <a *ngIf="seg.type !== 'text' && seg.active" class="inline-link" (click)="navigate(seg); $event.stopPropagation()">{{ seg.display }}</a>
      <span *ngIf="seg.type !== 'text' && !seg.active" class="inactive-link">{{ seg.display }}</span>
    </ng-container>
  `,
  styles: [`
    :host { display: inline; }
    .inline-link {
      color: #3387ce !important;
      text-decoration: underline !important;
      cursor: pointer;
      font-weight: 500;
    }
    .inline-link:hover {
      color: #2a6ea8 !important;
    }
    .inactive-link {
      font-weight: 500;
    }
  `],
})
export class LinkedTextComponent implements OnChanges {
  @Input() text: string = '';
  segments: TextSegment[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnChanges(): void {
    this.segments = this.text ? parseLinkedText(this.text) : [];
    this.validateEntities();
  }

  private validateEntities(): void {
    for (const seg of this.segments) {
      if (seg.type === 'oasis' && seg.entityId) {
        this.http.get<{ exists: boolean }>(`${environment.apiUrl}/oasis/exists/${seg.entityId}`)
          .subscribe({
            next: (res) => { seg.active = res.exists; },
            error: () => { seg.active = false; },
          });
      } else if (seg.type === 'boss' && seg.entityId) {
        this.http.get<{ exists: boolean }>(`${environment.apiUrl}/bosses/exists/${seg.entityId}`)
          .subscribe({
            next: (res) => { seg.active = res.exists; },
            error: () => { seg.active = false; },
          });
      }
    }
  }

  navigate(seg: TextSegment): void {
    switch (seg.type) {
      case 'player':
        this.router.navigate(['player', seg.value]);
        break;
      case 'village':
      case 'coords':
      case 'oasis':
      case 'boss':
        this.router.navigate(['Map'], { queryParams: { x: seg.x, y: seg.y } });
        break;
      case 'clan':
        this.router.navigate(['clan', seg.value]);
        break;
    }
  }
}
