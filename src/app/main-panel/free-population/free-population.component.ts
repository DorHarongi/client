import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-free-population',
  templateUrl: './free-population.component.html',
  styleUrls: ['./free-population.component.scss'],
})
export class FreePopulationComponent {
  @Input() freePopulation: number = 0;
  @Input() noPopulationText: string = '';
}
