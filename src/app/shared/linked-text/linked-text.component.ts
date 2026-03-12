import { Component, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';

export interface TextSegment {
  type: 'text' | 'player' | 'village' | 'coords' | 'clan';
  display: string;
  value?: string;
  x?: number;
  y?: number;
}

const LINK_REGEX = /\{(player|village|coords|clan):([^}]+)\}/g;

function parseLinkedText(raw: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  raw.replace(LINK_REGEX, (match, type, payload, offset) => {
    if (offset > lastIndex) {
      segments.push({ type: 'text', display: raw.slice(lastIndex, offset) });
    }

    const parts = payload.split('|');
    switch (type) {
      case 'player':
        segments.push({ type: 'player', display: parts[0], value: parts[0] });
        break;
      case 'village':
        segments.push({
          type: 'village',
          display: parts[0],
          x: Number(parts[1]),
          y: Number(parts[2]),
        });
        break;
      case 'coords':
        segments.push({
          type: 'coords',
          display: `(${parts[0]}, ${parts[1]})`,
          x: Number(parts[0]),
          y: Number(parts[1]),
        });
        break;
      case 'clan':
        segments.push({ type: 'clan', display: parts[0], value: parts[0] });
        break;
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < raw.length) {
    segments.push({ type: 'text', display: raw.slice(lastIndex) });
  }

  return segments;
}

@Component({
  selector: 'app-linked-text',
  template: `
    <ng-container *ngFor="let seg of segments">
      <span *ngIf="seg.type === 'text'">{{ seg.display }}</span>
      <a *ngIf="seg.type !== 'text'" class="inline-link" (click)="navigate(seg); $event.stopPropagation()">{{ seg.display }}</a>
    </ng-container>
  `,
  styles: [`
    :host { display: inline; }
    .inline-link {
      color: #1565c0;
      text-decoration: underline;
      cursor: pointer;
      font-weight: 500;
    }
    .inline-link:hover {
      color: #0d47a1;
    }
  `],
})
export class LinkedTextComponent implements OnChanges {
  @Input() text: string = '';
  segments: TextSegment[] = [];

  constructor(private router: Router) {}

  ngOnChanges(): void {
    this.segments = this.text ? parseLinkedText(this.text) : [];
  }

  navigate(seg: TextSegment): void {
    switch (seg.type) {
      case 'player':
        this.router.navigate(['player', seg.value]);
        break;
      case 'village':
      case 'coords':
        this.router.navigate(['Map'], { queryParams: { x: seg.x, y: seg.y } });
        break;
      case 'clan':
        this.router.navigate(['clan', seg.value]);
        break;
    }
  }
}
