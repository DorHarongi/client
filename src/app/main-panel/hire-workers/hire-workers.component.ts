import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Village } from '../models/Village';
@Component({
  selector: 'app-hire-workers',
  templateUrl: './hire-workers.component.html',
  styleUrls: ['./hire-workers.component.scss'],
})
export class HireWorkersComponent implements OnInit {
  @Input()
  workers!: number;

  @Output() onWorkersChange = new EventEmitter<number>();

  maxPossibleWorkers: number = 0;
  workersBeforeAnyChanges: number = 0;

  constructor(private userInformationService: UserInformationService) {}

  ngOnInit(): void {
    this.workersBeforeAnyChanges = this.workers;
    this.maxPossibleWorkers = this.checkFreePopulation();
  }

  checkFreePopulation(): number {
    let village: Village = this.userInformationService.currentVillage;
    return Village.getFreePopulation(village) + this.workersBeforeAnyChanges;
  }

  workersInputChange(value: number) {
    this.workers = this.fixInputValue(value, this.maxPossibleWorkers);
    this.maxPossibleWorkers = this.checkFreePopulation();
    this.onWorkersChange.emit(this.workers);
  }

  fixInputValue(value: number, maxValue: number): number {
    let freePoulation: number = maxValue;
    if (value > freePoulation || value < 0) {
      return 0;
    }
    return value;
  }

  hasFreePopulation(): boolean {
    let village: Village = this.userInformationService.currentVillage;
    return Village.getFreePopulation(village) > 0;
  }

  maxWorkers() {
    this.workers = this.maxPossibleWorkers;
    this.maxPossibleWorkers = 0;
    this.onWorkersChange.emit(this.workers);
  }
}
