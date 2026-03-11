import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { MapWindowResponse, MinimapResponse, VillageOnMap } from '../models/mapModels';
import { environment } from 'src/environments/environment';
import { UserInformationService } from '../../user-information/user-information.service';

export interface AvailableCell {
  x: number;
  y: number;
  hasBoss?: boolean;
}

interface CachedMapWindow {
  data: MapWindowResponse;
  timestamp: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // Cache for 5 minutes

@Injectable({
  providedIn: 'root'
})
export class WorldMapService {

  // Cache for map windows, keyed by "startX,startY"
  private mapCache: Map<string, CachedMapWindow> = new Map();
  private minimapCache: { data: MinimapResponse; timestamp: number } | null = null;

  constructor(private http: HttpClient, private userInfo: UserInformationService) { }

  private getCacheKey(startX: number, startY: number): string {
    return `${startX},${startY}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION_MS;
  }

  getMapWindow(startX: number, startY: number, forceRefresh: boolean = false): Observable<MapWindowResponse> {
    const cacheKey = this.getCacheKey(startX, startY);
    const cached = this.mapCache.get(cacheKey);

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return of(cached.data);
    }

    // Fetch from server and cache
    const username = this.userInfo.userInformation?.username || '';
    return this.http.get<MapWindowResponse>(`${environment.apiUrl}/world/map?startX=${startX}&startY=${startY}&username=${username}`)
      .pipe(
        tap(response => {
          this.mapCache.set(cacheKey, {
            data: response,
            timestamp: Date.now()
          });
        })
      );
  }

  getMinimap(forceRefresh: boolean = false): Observable<MinimapResponse> {
    // Return cached minimap if valid
    if (!forceRefresh && this.minimapCache && this.isCacheValid(this.minimapCache.timestamp)) {
      return of(this.minimapCache.data);
    }

    const username = this.userInfo.userInformation?.username || '';
    return this.http.get<MinimapResponse>(`${environment.apiUrl}/world/minimap?username=${username}`)
      .pipe(
        tap(response => {
          this.minimapCache = {
            data: response,
            timestamp: Date.now()
          };
        })
      );
  }

  getAvailableCells(centerX: number, centerY: number, range: number = 5): Observable<AvailableCell[]> {
    return this.http.get<AvailableCell[]>(
      `${environment.apiUrl}/world/available-cells?centerX=${centerX}&centerY=${centerY}&range=${range}`
    );
  }

  // Clear cache for a specific area (useful when player makes changes)
  invalidateMapCache(startX: number, startY: number): void {
    const cacheKey = this.getCacheKey(startX, startY);
    this.mapCache.delete(cacheKey);
  }

  // Clear all map cache
  clearAllMapCache(): void {
    this.mapCache.clear();
  }

  // Clear minimap cache
  clearMinimapCache(): void {
    this.minimapCache = null;
  }
}
