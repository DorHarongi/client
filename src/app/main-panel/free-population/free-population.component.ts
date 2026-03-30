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
    const baseline = this.originalFreePopulation ?? this.freePopulation;
    return baseline <= 0 && !!this.noPopulationText;
  }
}
