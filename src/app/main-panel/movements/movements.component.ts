import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserInformationService } from 'src/app/user-information/user-information.service';

interface Movement {
    type: 'attack' | 'support' | 'resources' | 'return' | 'boss_attack' | 'spy' | 'spy_return';
    senderUsername: string;
    senderVillageName: string;
    targetUsername: string;
    targetVillageName: string;
    departureTime: string;
    arrivalTime: string;
    status: 'in_transit' | 'completed';
    bossId?: string;
}

@Component({
    selector: 'app-movements',
    templateUrl: './movements.component.html',
    styleUrls: ['./movements.component.scss'],
})
export class MovementsComponent implements OnInit, OnDestroy {
    fromVillage: Movement[] = [];
    toVillage: Movement[] = [];
    private subscription?: Subscription;
    private tickSub?: Subscription;

    get hasMovements(): boolean {
        return this.fromVillage.length > 0 || this.toVillage.length > 0;
    }

    constructor(
        private http: HttpClient,
        private userInformationService: UserInformationService,
    ) {}

    ngOnInit(): void {
        this.loadMovements();
        this.subscription = interval(5000).subscribe(() => this.loadMovements());
        this.tickSub = interval(1000).subscribe(() => {});
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.tickSub?.unsubscribe();
    }

    loadMovements(): void {
        const username = this.userInformationService.userInformation.username;
        this.http
            .get<Movement[]>(`${environment.apiUrl}/users/movements/${username}`)
            .subscribe((movements) => {
                const now = Date.now();
                const from: Movement[] = [];
                const to: Movement[] = [];

                for (const m of movements) {
                    const arrival = new Date(m.arrivalTime).getTime();
                    if (arrival <= now) continue;

                    if (m.senderUsername === username) {
                        from.push(m);
                    } else if (m.targetUsername === username) {
                        to.push(m);
                    }
                }

                this.fromVillage = from.sort(
                    (a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime(),
                );
                this.toVillage = to.sort(
                    (a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime(),
                );
            });
    }

    getCountdown(movement: Movement): string {
        const ms = new Date(movement.arrivalTime).getTime() - Date.now();
        if (ms <= 0) return '0s';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    }

    getIcon(movement: Movement): string {
        if (movement.type === 'attack' || movement.type === 'boss_attack') {
            return 'assets/swords.png';
        }
        if (movement.type === 'spy' || movement.type === 'spy_return') {
            return 'assets/spy.png';
        }
        if (movement.type === 'support') {
            return 'assets/shield.png';
        }
        if (movement.type === 'resources') {
            return 'assets/wood.jpg';
        }
        if (movement.type === 'return') {
            return 'assets/shield.png';
        }
        return 'assets/swords.png';
    }

    getMovementName(movement: Movement, isFromVillage: boolean): string {
        if (movement.type === 'boss_attack') {
            return movement.targetVillageName;
        }
        if (movement.type === 'spy') {
            return `Spy → ${movement.targetUsername}`;
        }
        if (movement.type === 'spy_return') {
            return 'Spy returning';
        }
        if (movement.type === 'attack') {
            return isFromVillage
                ? `Attack → ${movement.targetUsername}`
                : `Attack from ${movement.senderUsername}`;
        }
        if (movement.type === 'support') {
            return isFromVillage
                ? `Support → ${movement.targetUsername}`
                : `Support from ${movement.senderUsername}`;
        }
        if (movement.type === 'resources') {
            return isFromVillage
                ? `Resources → ${movement.targetUsername}`
                : `Resources from ${movement.senderUsername}`;
        }
        if (movement.type === 'return') {
            return 'Troops returning';
        }
        return movement.type;
    }

    isEnemyAttack(movement: Movement): boolean {
        const username = this.userInformationService.userInformation.username;
        return movement.type === 'attack' && movement.targetUsername === username;
    }
}
