import { Component, Input } from '@angular/core';

export interface ResourcesDisplayAmounts {
  crop: number;
  wood: number;
  stone: number;
}

@Component({
  selector: 'app-resources-amount',
  templateUrl: './resources-amount.component.html',
  styleUrls: ['./resources-amount.component.scss']
})
export class ResourcesAmountComponent {

  @Input() resources!: ResourcesDisplayAmounts;
  @Input() label: string = '';

  formatNumber(value: number): string {
    return value.toFixed(0);
  }
}
