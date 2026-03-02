import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserInformationService } from 'src/app/user-information/user-information.service';

interface Movement {
    type: 'attack' | 'support' | 'resources' | 'return';
    senderUsername: string;
    senderVillageName: string;
    targetUsername: string;
    targetVillageName: string;
    departureTime: string;
    arrivalTime: string;
    status: 'in_transit' | 'completed';
}

@Component({
    selector: 'app-movements',
    templateUrl: './movements.component.html',
    styleUrls: ['./movements.component.scss'],
})
export class MovementsComponent implements OnInit, OnDestroy {
    incoming: Movement[] = [];
    outgoing: Movement[] = [];
    private subscription?: Subscription;

    constructor(
        private http: HttpClient,
        private userInformationService: UserInformationService,
    ) {}

    ngOnInit(): void {
        this.loadMovements();
        this.subscription = interval(5000).subscribe(() => this.loadMovements());
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    loadMovements(): void {
        const username = this.userInformationService.userInformation.username;
        this.http
            .get<Movement[]>(`${environment.apiUrl}/users/movements/${username}`)
            .subscribe((movements) => {
                const now = Date.now();
                const incoming: Movement[] = [];
                const outgoing: Movement[] = [];

                for (const m of movements) {
                    const arrival = new Date(m.arrivalTime).getTime();
                    if (arrival <= now) {
                        continue;
                    }
                    if (m.targetUsername === username && m.type === 'attack') {
                        incoming.push(m);
                    } else {
                        outgoing.push(m);
                    }
                }

                // Sort by soonest arrival
                this.incoming = incoming.sort(
                    (a, b) =>
                        new Date(a.arrivalTime).getTime() -
                        new Date(b.arrivalTime).getTime(),
                );
                this.outgoing = outgoing.sort(
                    (a, b) =>
                        new Date(a.arrivalTime).getTime() -
                        new Date(b.arrivalTime).getTime(),
                );
            });
    }

    getCountdown(movement: Movement): string {
        const ms =
            new Date(movement.arrivalTime).getTime() - new Date().getTime();
        if (ms <= 0) return '0s';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }

    getLabel(movement: Movement): string {
        if (movement.type === 'attack') {
            return 'Attack';
        }
        if (movement.type === 'return') {
            return 'Return';
        }
        if (movement.type === 'support') {
            return 'Support';
        }
        if (movement.type === 'resources') {
            return 'Resources';
        }
        return movement.type;
    }
}

