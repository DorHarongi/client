import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { environment } from 'src/environments/environment';
import {
  academyUpgradeMaterialCostByLevels,
  canLearnSkill,
  getResetCost,
  getSkillPointsByAcademyLevel,
  getUsedSkillPoints,
  MaterialsCost,
  SKILL_METADATA,
  SKILL_TIER_COSTS,
  SkillCategory,
  Skills,
  SkillTier,
} from 'utils';
import { Building } from '../../classes/Building';
import { User } from '../../models/User';

interface SkillCell {
  category: SkillCategory;
  tier: SkillTier;
  name: string;
  bonusPercent: number;
  description: string;
  cost: number;
  icon: string;
}

@Component({
  selector: 'app-academy',
  templateUrl: './academy.component.html',
  styleUrls: ['./academy.component.scss'],
})
export class AcademyComponent implements OnInit, OnDestroy {
  buildingInformation: Building;

  skills!: Skills;
  availablePoints: number = 0;
  totalPoints: number = 0;
  usedPoints: number = 0;
  resetCost: MaterialsCost = { wood: 0, stones: 0, crop: 0 };

  grid: SkillCell[][] = [];
  tierHeaders: string[] = ['Tier I', 'Tier II', 'Tier III'];

  loading: boolean = false;
  errorMessage: string = '';

  // Confirmation dialog state
  showLearnConfirm: boolean = false;
  pendingLearnCell: SkillCell | null = null;

  showResetConfirm: boolean = false;
  hoveredTileBelow: boolean = false;

  subscription?: Subscription;

  constructor(
    private userInformationService: UserInformationService,
    private http: HttpClient
  ) {
    const academyLevel =
      this.userInformationService.currentVillage.buildingsLevels.academyLevel;

    this.buildingInformation = new Building(
      'academy',
      'Academy',
      academyLevel,
      'The Academy grants Skill Points which you can invest in powerful skills. Each level gives +2 points.',
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
    return this.userInformationService.currentVillage.buildingsLevels
      .academyLevel;
  }

  private recalculatePoints(): void {
    this.totalPoints = getSkillPointsByAcademyLevel(this.academyLevel);
    const used = getUsedSkillPoints(this.skills);
    this.usedPoints = used;
    this.availablePoints = this.totalPoints - used;
    this.resetCost = getResetCost(this.usedPoints);
  }

  private buildGrid(): void {
    const byCategory: { [key in SkillCategory]: SkillCell[] } = {} as any;
    for (const meta of SKILL_METADATA) {
      const tierBonuses = meta.tierBonuses;
      const cells: SkillCell[] = [
        {
          category: meta.category,
          tier: SkillTier.I,
          name: meta.name,
          description: meta.description,
          bonusPercent: Math.round(tierBonuses[SkillTier.I] * 100),
          cost: SKILL_TIER_COSTS[SkillTier.I],
          icon: meta.icon,
        },
        {
          category: meta.category,
          tier: SkillTier.II,
          name: meta.name,
          description: meta.description,
          bonusPercent: Math.round(tierBonuses[SkillTier.II] * 100),
          cost: SKILL_TIER_COSTS[SkillTier.II],
          icon: meta.icon,
        },
        {
          category: meta.category,
          tier: SkillTier.III,
          name: meta.name,
          description: meta.description,
          bonusPercent: Math.round(tierBonuses[SkillTier.III] * 100),
          cost: SKILL_TIER_COSTS[SkillTier.III],
          icon: meta.icon,
        },
      ];
      byCategory[meta.category] = cells;
    }

    this.grid = [];
    const categories = Object.keys(byCategory) as SkillCategory[];
    for (const category of categories) {
      this.grid.push(byCategory[category]);
    }
  }

  getSkillState(cell: SkillCell): 'unlocked' | 'available' | 'locked' {
    const currentTier = this.skills[cell.category];
    const tierOrder: SkillTier[] = [SkillTier.I, SkillTier.II, SkillTier.III];
    const currentIdx = currentTier ? tierOrder.indexOf(currentTier) : -1;
    const cellIdx = tierOrder.indexOf(cell.tier);

    if (currentIdx >= cellIdx) {
      return 'unlocked';
    }

    if (
      canLearnSkill(this.academyLevel, this.skills, cell.category, cell.tier)
    ) {
      return 'available';
    }

    return 'locked';
  }

  canLearn(cell: SkillCell): boolean {
    return canLearnSkill(
      this.academyLevel,
      this.skills,
      cell.category,
      cell.tier
    );
  }

  onSkillClick(cell: SkillCell): void {
    if (!this.canLearn(cell) || this.loading) return;
    this.pendingLearnCell = cell;
    this.showLearnConfirm = true;
  }

  confirmLearnSkill(): void {
    if (!this.pendingLearnCell || this.loading) return;
    const cell = this.pendingLearnCell;

    this.loading = true;
    this.errorMessage = '';

    this.subscription = this.http
      .post<User>(`${environment.apiUrl}/interactions/learn-skill`, {
        villageIndex: this.userInformationService.currentVillageIndex,
        category: cell.category,
        tier: cell.tier,
      })
      .subscribe({
        next: (user: User) => {
          this.userInformationService.setUserInformation(user);
          this.skills = this.userInformationService.currentVillage.skills;
          this.recalculatePoints();
          this.loading = false;
          this.cancelLearnConfirm();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to learn skill';
          this.loading = false;
          this.cancelLearnConfirm();
        },
      });
  }

  cancelLearnConfirm(): void {
    this.showLearnConfirm = false;
    this.pendingLearnCell = null;
  }

  onResetClick(): void {
    if (this.loading || this.usedPoints <= 0) return;
    this.showResetConfirm = true;
  }

  confirmResetSkills(): void {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    this.subscription = this.http
      .post<User>(`${environment.apiUrl}/interactions/reset-skills`, {
        villageIndex: this.userInformationService.currentVillageIndex,
      })
      .subscribe({
        next: (user: User) => {
          this.userInformationService.setUserInformation(user);
          this.skills = this.userInformationService.currentVillage.skills;
          this.recalculatePoints();
          this.loading = false;
          this.cancelResetConfirm();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to reset skills';
          this.loading = false;
          this.cancelResetConfirm();
        },
      });
  }

  cancelResetConfirm(): void {
    this.showResetConfirm = false;
  }

  onTileHover(event: MouseEvent): void {
    const tile = event.currentTarget as HTMLElement;
    const rect = tile.getBoundingClientRect();
    const spaceAbove = rect.top;
    const tooltipHeight = 120;
    this.hoveredTileBelow = spaceAbove < tooltipHeight;
  }
}
