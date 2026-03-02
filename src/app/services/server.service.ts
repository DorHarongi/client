import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface ServerStatus {
  serverId: number;
  status: 'active' | 'ended';
  winningClanName?: string;
  endedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ServerService {
  constructor(private http: HttpClient) {}

  getStatus() {
    return this.http.get<ServerStatus>(`${environment.apiUrl}/server/status`);
  }
}
