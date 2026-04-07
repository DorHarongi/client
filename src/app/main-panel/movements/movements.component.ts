import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { environment } from 'src/environments/environment';

interface Movement {
  type:
    | 'attack'
    | 'support'
    | 'resources'
    | 'return'
    | 'boss_attack'
    | 'spy'
    | 'spy_return'
    | 'relic_transfer'
    | 'oasis_garrison'
    | 'oasis_attack'
    | 'oasis_return';
  senderUsername: string;
  senderVillageName: string;
  targetUsername: string;
  targetVillageName: string;
  departureTime: string;
  arrivalTime: string;
  status: 'in_transit' | 'completed';
  bossId?: string;
  relicId?: string;
  spyCount?: number;
}

const RELIC_ICON_MAP: Record<string, string> = {
  apple_of_immortality: 'assets/apple.png',
  eternal_flame: 'assets/flame.png',
  chalice_of_ascension: 'assets/chalice.png',
  all_seeing_orb: 'assets/orn.png',
  sigil_of_creation: 'assets/sigil.png',
};

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
  private arrivalTimers: ReturnType<typeof setTimeout>[] = [];
  private visibilityHandler = () => this.onVisibilityChange();

  get hasMovements(): boolean {
    return this.fromVillage.length > 0 || this.toVillage.length > 0;
  }

  get villageCount(): number {
    return this.userInformationService.userInformation?.villages?.length ?? 1;
  }

  constructor(
    private http: HttpClient,
    private userInformationService: UserInformationService
  ) {}

  ngOnInit(): void {
    this.loadMovements();
    this.startPolling();
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.clearArrivalTimers();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  private onVisibilityChange(): void {
    if (document.hidden) {
      this.stopPolling();
    } else {
      this.loadMovements();
      this.startPolling();
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.subscription = interval(5000).subscribe(() => this.loadMovements());
    this.tickSub = interval(1000).subscribe(() => {});
  }

  private stopPolling(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.tickSub?.unsubscribe();
    this.tickSub = undefined;
  }

  private clearArrivalTimers(): void {
    for (const t of this.arrivalTimers) clearTimeout(t);
    this.arrivalTimers = [];
  }

  private scheduleArrivalRefreshes(): void {
    this.clearArrivalTimers();
    const now = Date.now();
    const seen = new Set<number>();

    for (const m of [...this.fromVillage, ...this.toVillage]) {
      const arrival = new Date(m.arrivalTime).getTime();
      if (arrival <= now || seen.has(arrival)) continue;
      seen.add(arrival);

      const delay = arrival - now + 300;
      const timer = setTimeout(() => {
        this.userInformationService.refreshUserInformation();
        this.loadMovements();
      }, delay);
      this.arrivalTimers.push(timer);
    }
  }

  loadMovements(): void {
    const username = this.userInformationService.userInformation.username;
    this.http
      .get<Movement[]>(`${environment.apiUrl}/users/movements/${username}`)
      .subscribe((movements) => {
        const now = Date.now();
        const from: Movement[] = [];
        const to: Movement[] = [];

        const returnTypes = new Set(['return', 'oasis_return', 'spy_return']);
        for (const m of movements) {
          const arrival = new Date(m.arrivalTime).getTime();
          if (arrival <= now) continue;

          if (returnTypes.has(m.type)) {
            to.push(m);
          } else if (m.senderUsername === username) {
            from.push(m);
          } else if (m.targetUsername === username) {
            to.push(m);
          }
        }

        this.fromVillage = from.sort(
          (a, b) =>
            new Date(a.arrivalTime).getTime() -
            new Date(b.arrivalTime).getTime()
        );
        this.toVillage = to.sort(
          (a, b) =>
            new Date(a.arrivalTime).getTime() -
            new Date(b.arrivalTime).getTime()
        );

        this.scheduleArrivalRefreshes();
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
    if (movement.type === 'relic_transfer') {
      return (movement.relicId && RELIC_ICON_MAP[movement.relicId]) || 'assets/sigil.png';
    }
    if (movement.type === 'return') {
      return 'assets/swords.png';
    }
    if (movement.type === 'oasis_garrison' || movement.type === 'oasis_attack' || movement.type === 'oasis_return') {
      return 'assets/oasis.png';
    }
    return 'assets/swords.png';
  }

  getMovementName(movement: Movement, isFromVillage: boolean): string {
    if (movement.type === 'boss_attack') {
      return `You [${movement.senderVillageName}] → ${movement.targetVillageName}`;
    }
    if (movement.type === 'spy') {
      const label = (movement.spyCount || 1) > 1 ? 'Spies' : 'Spy';
      return `${label} [${movement.senderVillageName}] → ${movement.targetUsername} [${movement.targetVillageName}]`;
    }
    if (movement.type === 'spy_return') {
      const dest = movement.targetVillageName || movement.senderVillageName;
      const label = (movement.spyCount || 1) > 1 ? 'Spies' : 'Spy';
      return dest ? `${label} returning → You [${dest}]` : `${label} returning`;
    }
    if (movement.type === 'oasis_garrison') {
      return `Troops [${movement.senderVillageName}] → Oasis`;
    }
    if (movement.type === 'oasis_attack') {
      return `Troops [${movement.senderVillageName}] → Oasis`;
    }
    if (movement.type === 'oasis_return') {
      const dest = movement.targetVillageName || movement.senderVillageName;
      return dest ? `Troops returning → You [${dest}]` : 'Troops returning';
    }

    if (movement.type === 'attack') {
      if (isFromVillage) {
        return `You [${movement.senderVillageName}] → ${movement.targetUsername} [${movement.targetVillageName}]`;
      }
      return `${movement.senderUsername} [${movement.senderVillageName}] → You [${movement.targetVillageName}]`;
    }
    if (movement.type === 'support') {
      if (isFromVillage) {
        return `You [${movement.senderVillageName}] → ${movement.targetUsername} [${movement.targetVillageName}]`;
      }
      return `${movement.senderUsername} [${movement.senderVillageName}] → You [${movement.targetVillageName}]`;
    }
    if (movement.type === 'resources') {
      if (isFromVillage) {
        return `You [${movement.senderVillageName}] → ${movement.targetUsername} [${movement.targetVillageName}]`;
      }
      return `${movement.senderUsername} [${movement.senderVillageName}] → You [${movement.targetVillageName}]`;
    }
    if (movement.type === 'relic_transfer') {
      if (isFromVillage) {
        return `Relic [${movement.senderVillageName}] → ${movement.targetUsername} [${movement.targetVillageName}]`;
      }
      return `Relic from ${movement.senderUsername} [${movement.senderVillageName}] → You [${movement.targetVillageName}]`;
    }
    if (movement.type === 'return') {
      const dest = movement.targetVillageName || movement.senderVillageName;
      return dest ? `Troops returning → You [${dest}]` : 'Troops returning';
    }
    return movement.type;
  }

  isEnemyAttack(movement: Movement): boolean {
    const username = this.userInformationService.userInformation.username;
    return movement.type === 'attack' && movement.targetUsername === username;
  }
}
