import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ClanDTO {
    clanName: string;
    description: string;
    leaderUsername: string;
    members: string[];
    isOpen: boolean;
    pendingRequests: { username: string; message: string; requestDate: Date }[];
    createdDate: Date;
    totalBossesKilled: number;
}

export interface ClanStatisticDTO {
    clanName: string;
    description: string;
    leaderUsername: string;
    memberCount: number;
    totalPopulation: number;
    isOpen: boolean;
    totalBossesKilled: number;
    heldRelicIds?: string[];
}

export interface ClanMemberRaidStatsDTO {
    username: string;
    weeklyRaidDamage: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClanService {

  constructor(private http: HttpClient) { }

  getClan(clanName: string): Observable<ClanDTO> {
    return this.http.get<ClanDTO>(`${environment.apiUrl}/clans/${clanName}`);
  }

  createClan(clanName: string, description: string, leaderUsername: string, isOpen: boolean): Observable<ClanDTO> {
    return this.http.post<ClanDTO>(`${environment.apiUrl}/clans/create`, {
      clanName,
      description,
      leaderUsername,
      isOpen
    });
  }

  getNumberOfClanStatisticsPages(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/clans/statistics/pages`);
  }

  getClanStatistics(page: number): Observable<ClanStatisticDTO[]> {
    return this.http.get<ClanStatisticDTO[]>(`${environment.apiUrl}/clans/statistics/page/${page}`);
  }

  getClanStatisticsPage(clanName: string): Observable<{ page: number }> {
    return this.http.get<{ page: number }>(`${environment.apiUrl}/clans/statistics/page-for/${encodeURIComponent(clanName)}`);
  }

  requestToJoinClan(clanName: string, username: string, message?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/clans/join`, {
      clanName,
      username,
      message
    });
  }

  handleJoinRequest(clanName: string, leaderUsername: string, requestUsername: string, accept: boolean): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/clans/handle-request`, {
      clanName,
      leaderUsername,
      requestUsername,
      accept
    });
  }

  leaveClan(clanName: string, username: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/clans/leave`, {
      clanName,
      username
    });
  }

  kickMember(clanName: string, leaderUsername: string, memberUsername: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/clans/kick`, {
      clanName,
      leaderUsername,
      memberUsername
    });
  }

  updateClanName(oldClanName: string, newClanName: string, leaderUsername: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/clans/update-name`, {
      oldClanName,
      newClanName,
      leaderUsername
    });
  }

  toggleClanOpen(clanName: string, leaderUsername: string, isOpen: boolean): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/clans/toggle-open`, {
      clanName,
      leaderUsername,
      isOpen
    });
  }

  getClanMemberRaidStats(clanName: string): Observable<ClanMemberRaidStatsDTO[]> {
    return this.http.get<ClanMemberRaidStatsDTO[]>(`${environment.apiUrl}/clans/${clanName}/raid-stats`);
  }

  updateClanDescription(clanName: string, description: string, leaderUsername: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/clans/update-description`, {
      clanName,
      description,
      leaderUsername
    });
  }
}
