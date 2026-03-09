import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ExpertSpyStatus {
  status: 'available' | 'deployed' | 'dead';
  targetUsername?: string;
  targetVillageName?: string;
  returnsAt?: string;
  cooldownEndsAt?: string;
}

export interface DeployExpertSpyRequest {
  villageName: string;
  targetUsername: string;
  targetVillageName: string;
  targetType: 'village' | 'oasis';
  targetOasisId?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpertSpyService {
  constructor(private http: HttpClient) {}

  deployExpertSpy(
    villageName: string,
    targetUsername: string,
    targetVillageName: string,
    targetType: 'village' | 'oasis',
    targetOasisId?: string
  ): Observable<{ success: boolean; travelTimeMs?: number }> {
    const body: DeployExpertSpyRequest = {
      villageName,
      targetUsername,
      targetVillageName,
      targetType,
    };
    if (targetOasisId) {
      body.targetOasisId = targetOasisId;
    }
    return this.http.post<{ success: boolean; travelTimeMs?: number }>(
      `${environment.apiUrl}/expert-spy/deploy`,
      body
    );
  }

  getExpertSpyStatus(villageName: string): Observable<ExpertSpyStatus> {
    return this.http.get<ExpertSpyStatus>(
      `${environment.apiUrl}/expert-spy/status/${encodeURIComponent(villageName)}`
    );
  }
}
