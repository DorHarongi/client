import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-free-population',
  templateUrl: './free-population.component.html',
  styleUrls: ['./free-population.component.scss'],
})
export class FreePopulationComponent {
  @Input() freePopulation: number = 0;
  @Input() originalFreePopulation?: number;
  @Input() noPopulationText: string = '';

  get showWarning(): boolean {
    if (!this.noPopulationText) return false;
    const original = this.originalFreePopulation ?? this.freePopulation;
    return original <= 0 && this.freePopulation <= 0;
  }
}
