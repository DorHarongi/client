import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ClanDTO {
    clanName: string;
    description: string;
    leaderUsername: string;
    members: string[];
    isOpen: boolean;
    pendingRequests: { username: string; message: string; requestDate: Date }[];
    createdDate: Date;
}

export interface ClanStatisticDTO {
    clanName: string;
    description: string;
    leaderUsername: string;
    memberCount: number;
    totalPopulation: number;
    isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClanService {

  constructor(private http: HttpClient) { }

  getClan(clanName: string): Observable<ClanDTO> {
    return this.http.get<ClanDTO>(`http://localhost:3000/clans/${clanName}`);
  }

  createClan(clanName: string, description: string, leaderUsername: string, isOpen: boolean): Observable<ClanDTO> {
    return this.http.post<ClanDTO>('http://localhost:3000/clans/create', {
      clanName,
      description,
      leaderUsername,
      isOpen
    });
  }

  getNumberOfClanStatisticsPages(): Observable<number> {
    return this.http.get<number>('http://localhost:3000/clans/statistics/pages');
  }

  getClanStatistics(page: number): Observable<ClanStatisticDTO[]> {
    return this.http.get<ClanStatisticDTO[]>(`http://localhost:3000/clans/statistics/page/${page}`);
  }

  requestToJoinClan(clanName: string, username: string, message?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('http://localhost:3000/clans/join', {
      clanName,
      username,
      message
    });
  }

  handleJoinRequest(clanName: string, leaderUsername: string, requestUsername: string, accept: boolean): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('http://localhost:3000/clans/handle-request', {
      clanName,
      leaderUsername,
      requestUsername,
      accept
    });
  }

  leaveClan(clanName: string, username: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('http://localhost:3000/clans/leave', {
      clanName,
      username
    });
  }
}
