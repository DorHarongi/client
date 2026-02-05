import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { 
    academyUpgradeMaterialCostByLevels, 
    VillageTrait, 
    traitDescriptions, 
    traitBonusByLevel,
    ACADEMY_TRAIT_UNLOCK_LEVEL,
    canSelectTrait,
    getTraitBonus,
    warehouseStorageByLevel
} from 'utils';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { Building } from '../../classes/Building';
import { environment } from 'src/environments/environment';
import { User } from '../../models/User';

interface TraitOption {
    trait: VillageTrait;
    name: string;
    shortDesc: string;
    fullDesc: string;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-academy',
    templateUrl: './academy.component.html',
    styleUrls: ['./academy.component.scss']
})
export class AcademyComponent implements OnInit, OnDestroy {

    buildingInformation: Building;
    
    // Trait system
    traits: TraitOption[] = [];
    currentTraitIndex: number = 0;
    currentTrait: VillageTrait | undefined;
    canSelectTrait: boolean = false;
    traitUnlockLevel = ACADEMY_TRAIT_UNLOCK_LEVEL;
    
    // Switching costs
    switchCost: { wood: number; crop: number; stones: number } = { wood: 0, crop: 0, stones: 0 };
    isFirstTraitSelection: boolean = false;
    
    // UI state
    isSpinning: boolean = false;
    showConfirmDialog: boolean = false;
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
            "The Academy is where your village chooses its specialization. At level 3, you can select one of three powerful traits that shape your village's destiny. Choose wisely - the first selection is free, but changing later will cost all resources equal to your warehouse capacity!",
            academyUpgradeMaterialCostByLevels[academyLevel + 1]
        );
        
        this.currentTrait = this.userInformationService.currentVillage.trait;
        this.canSelectTrait = canSelectTrait(academyLevel);
        this.isFirstTraitSelection = this.currentTrait === undefined && this.canSelectTrait;
        
        // Initialize traits
        this.traits = [
            { trait: VillageTrait.WARLORD, ...traitDescriptions[VillageTrait.WARLORD] },
            { trait: VillageTrait.GUARDIAN, ...traitDescriptions[VillageTrait.GUARDIAN] },
            { trait: VillageTrait.VANGUARD, ...traitDescriptions[VillageTrait.VANGUARD] }
        ];
        
        // Set initial carousel position to current trait or first trait
        if (this.currentTrait) {
            this.currentTraitIndex = this.traits.findIndex(t => t.trait === this.currentTrait);
            if (this.currentTraitIndex === -1) this.currentTraitIndex = 0;
        }
        
        this.calculateSwitchCost();
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    get academyLevel(): number {
        return this.userInformationService.currentVillage.buildingsLevels.academyLevel;
    }

    get currentBonus(): number {
        return getTraitBonus(this.academyLevel);
    }

    get currentBonusPercent(): string {
        return Math.round(this.currentBonus * 100) + '%';
    }

    get selectedTrait(): TraitOption {
        return this.traits[this.currentTraitIndex];
    }

    get isSelectedTraitDifferent(): boolean {
        return this.selectedTrait.trait !== this.currentTrait;
    }

    get canAffordSwitch(): boolean {
        if (this.isFirstTraitSelection) return true;
        const village = this.userInformationService.currentVillage;
        return village.resourcesAmounts.woodAmount >= this.switchCost.wood &&
               village.resourcesAmounts.cropAmount >= this.switchCost.crop &&
               village.resourcesAmounts.stonesAmount >= this.switchCost.stones;
    }

    calculateSwitchCost(): void {
        if (this.isFirstTraitSelection) {
            this.switchCost = { wood: 0, crop: 0, stones: 0 };
        } else {
            const storage = warehouseStorageByLevel[this.academyLevel] || 0;
            this.switchCost = { wood: storage, crop: storage, stones: storage };
        }
    }

    // Carousel controls
    spinLeft(): void {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.currentTraitIndex = (this.currentTraitIndex - 1 + this.traits.length) % this.traits.length;
        setTimeout(() => this.isSpinning = false, 300);
    }

    spinRight(): void {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.currentTraitIndex = (this.currentTraitIndex + 1) % this.traits.length;
        setTimeout(() => this.isSpinning = false, 300);
    }

    getTraitPosition(index: number): { transform: string; opacity: number; zIndex: number } {
        const diff = index - this.currentTraitIndex;
        const normalizedDiff = ((diff + this.traits.length + 1) % this.traits.length) - 1;
        
        if (normalizedDiff === 0) {
            // Center (selected)
            return { transform: 'translateX(0) scale(1)', opacity: 1, zIndex: 3 };
        } else if (normalizedDiff === 1 || normalizedDiff === -2) {
            // Right
            return { transform: 'translateX(120px) scale(0.7)', opacity: 0.6, zIndex: 1 };
        } else {
            // Left
            return { transform: 'translateX(-120px) scale(0.7)', opacity: 0.6, zIndex: 1 };
        }
    }

    isCurrentTrait(trait: VillageTrait): boolean {
        return trait === this.currentTrait;
    }

    // Trait switching
    openConfirmDialog(): void {
        if (!this.canSelectTrait || !this.isSelectedTraitDifferent) return;
        this.showConfirmDialog = true;
        this.errorMessage = '';
    }

    closeConfirmDialog(): void {
        this.showConfirmDialog = false;
    }

    confirmTraitSwitch(): void {
        if (this.loading) return;
        
        this.loading = true;
        this.errorMessage = '';
        
        this.subscription = this.http.post<User>(`${environment.apiUrl}/interactions/switch-trait`, {
            username: this.userInformationService.userInformation.username,
            villageIndex: this.userInformationService.currentVillageIndex,
            newTrait: this.selectedTrait.trait
        }).subscribe({
            next: (user: User) => {
                this.userInformationService.setUserInformation(user);
                this.currentTrait = this.selectedTrait.trait;
                this.isFirstTraitSelection = false;
                this.calculateSwitchCost();
                this.showConfirmDialog = false;
                this.loading = false;
            },
            error: (err) => {
                this.errorMessage = err.error?.message || 'Failed to switch trait';
                this.loading = false;
            }
        });
    }

    getTraitBonusDescription(): string {
        const bonus = this.currentBonusPercent;
        const trait = this.selectedTrait.trait;
        
        switch (trait) {
            case VillageTrait.WARLORD:
                return `+${bonus} attack power in PvP and PvE battles`;
            case VillageTrait.GUARDIAN:
                return `+${bonus} defense power, -${bonus} troop losses when attacking`;
            case VillageTrait.VANGUARD:
                return `+${bonus} resource & energy gathering speed, +${bonus} troop movement speed`;
            default:
                return '';
        }
    }

    getCurrentTraitName(): string {
        if (!this.currentTrait) return 'None';
        return traitDescriptions[this.currentTrait]?.name || 'Unknown';
    }
}
