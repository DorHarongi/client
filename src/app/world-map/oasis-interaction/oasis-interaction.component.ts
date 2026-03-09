import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { OasisOnMap } from '../models/mapModels';

@Component({
  selector: 'app-oasis-interaction',
  templateUrl: './oasis-interaction.component.html',
  styleUrls: ['./oasis-interaction.component.scss'],
})
export class OasisInteractionComponent {
  @Input() oasis!: OasisOnMap;
  @Input() currentUsername!: string;
  @Output() closed: EventEmitter<void> = new EventEmitter<void>();

  constructor(private router: Router) {}

  findOnMap(): void {
    this.router.navigate(['Map'], {
      queryParams: { x: this.oasis.x, y: this.oasis.y },
    });
  }

  close(): void {
    this.closed.emit();
  }
}
