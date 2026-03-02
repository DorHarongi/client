import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import {
  academyUpgradeMaterialCostByLevels,
  Skills,
  SKILL_METADATA,
  getSkillPointsByAcademyLevel,
  getUsedSkillPoints,
  SkillCategory,
  SkillTier,
} from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
import { environment } from 'src/environments/environment';
import { User } from '../../models/User';

interface SkillCell {
  category: SkillCategory;
  tier: SkillTier;
  name: string;
  bonusPercent: number;
}

@Component({
  selector: 'app-academy',
  templateUrl: './academy.component.html',
  styleUrls: ['./academy.component.scss']
})
export class AcademyComponent implements OnInit, OnDestroy {

  buildingInformation: Building;

  skills!: Skills;
  availablePoints: number = 0;
  totalPoints: number = 0;

  grid: SkillCell[][] = [];

  loading: boolean = false;
  errorMessage: string = '';

  subscription?: Subscription;

  constructor(
    private userInformationService: UserInformationService,
    private http: HttpClient
  ) {
    const academyLevel = this.userInformationService.currentVillage.buildingsLevels.academyLevel;

    this.buildingInformation = new Building(
      "academy",
      "Academy",
      academyLevel,
      "The Academy grants Skill Points which you can invest in powerful skills. Each level gives +2 points. Choose your build wisely!",
      academyUpgradeMaterialCostByLevels[academyLevel + 1]
    );

    this.skills = this.userInformationService.currentVillage.skills;
    this.recalculatePoints();
    this.buildGrid();
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get academyLevel(): number {
    return this.userInformationService.currentVillage.buildingsLevels.academyLevel;
  }

  private recalculatePoints(): void {
    this.totalPoints = getSkillPointsByAcademyLevel(this.academyLevel);
    const used = getUsedSkillPoints(this.skills);
    this.availablePoints = this.totalPoints - used;
  }

  private buildGrid(): void {
    const byCategory: { [key in SkillCategory]: SkillCell[] } = {} as any;
    for (const meta of SKILL_METADATA) {
      const cells: SkillCell[] = [
        { category: meta.category, tier: SkillTier.I, name: meta.name, bonusPercent: Math.round(meta.tierBonuses[SkillTier.I] * 100) },
        { category: meta.category, tier: SkillTier.II, name: meta.name, bonusPercent: Math.round(meta.tierBonuses[SkillTier.II] * 100) },
        { category: meta.category, tier: SkillTier.III, name: meta.name, bonusPercent: Math.round(meta.tierBonuses[SkillTier.III] * 100) },
      ];
      byCategory[meta.category] = cells;
    }

    this.grid = [[], [], []];
    const categories = Object.keys(byCategory) as SkillCategory[];
    for (const category of categories) {
      const cells = byCategory[category];
      this.grid[0].push(cells[0]);
      this.grid[1].push(cells[1]);
      this.grid[2].push(cells[2]);
    }
  }

  getSkillState(cell: SkillCell): 'unlocked' | 'available' | 'locked' {
    const currentTier = this.skills[cell.category];
    if (currentTier === cell.tier) return 'unlocked';

    // determine if this tier is available to learn
    const tierOrder: SkillTier[] = [SkillTier.I, SkillTier.II, SkillTier.III];
    const idx = tierOrder.indexOf(cell.tier);
    const prevTier = idx > 0 ? tierOrder[idx - 1] : undefined;

    // already learned higher tier? then unlocked is the highest only
    if (currentTier && tierOrder.indexOf(currentTier) > idx) {
      return 'locked';
    }

    // tier I: available if not learned yet and has points
    if (cell.tier === 'I') {
      return this.availablePoints > 0 && !currentTier ? 'available' : currentTier === 'I' ? 'unlocked' : 'locked';
    }

    // tier II/III: require previous tier learned
    if (prevTier && currentTier === prevTier && this.availablePoints > 0) {
      return 'available';
    }

    return 'locked';
  }

  canLearn(cell: SkillCell): boolean {
    return this.getSkillState(cell) === 'available';
  }

  learnSkill(cell: SkillCell): void {
    if (!this.canLearn(cell) || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.subscription = this.http.post<User>(`${environment.apiUrl}/interactions/learn-skill`, {
      villageIndex: this.userInformationService.currentVillageIndex,
      category: cell.category,
      tier: cell.tier,
    }).subscribe({
      next: (user: User) => {
        this.userInformationService.setUserInformation(user);
        this.skills = this.userInformationService.currentVillage.skills;
        this.recalculatePoints();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to learn skill';
        this.loading = false;
      }
    });
  }

  resetSkills(): void {
    if (this.loading) return;
    this.loading = true;
    this.errorMessage = '';

    this.subscription = this.http.post<User>(`${environment.apiUrl}/interactions/reset-skills`, {
      villageIndex: this.userInformationService.currentVillageIndex,
    }).subscribe({
      next: (user: User) => {
        this.userInformationService.setUserInformation(user);
        this.skills = this.userInformationService.currentVillage.skills;
        this.recalculatePoints();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to reset skills';
        this.loading = false;
      }
    });
  }
}
