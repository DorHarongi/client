import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ServerStatus {
  serverId: number;
  status: 'active' | 'ended';
  winningClanName?: string;
  endedAt?: string;
}

export interface ServerListItem {
  serverId: number;
  name: string;
  status: string;
  playerCount?: number;
  isClosed?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ServerService {
  serverEnded = false;
  winningClanName: string | null = null;

  constructor(private http: HttpClient) {}

  setServerStatus(status: ServerStatus): void {
    this.serverEnded = status.status === 'ended';
    this.winningClanName = status.winningClanName ?? null;
  }

  getStatus(): Observable<ServerStatus> {
    return this.http.get<ServerStatus>(`${environment.apiUrl}/server/status`);
  }

  getServers(): Observable<ServerListItem[]> {
    return this.http.get<ServerListItem[]>(`${environment.apiUrl}/server/servers`);
  }

  joinServer(serverId: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/server/servers/join`, { serverId });
  }
}
