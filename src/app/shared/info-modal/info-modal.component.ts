import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-info-modal',
  templateUrl: './info-modal.component.html',
  styleUrls: ['./info-modal.component.scss'],
})
export class InfoModalComponent {
  @Input() title: string = 'Information';
  @Input() lines: string[] = [];
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
