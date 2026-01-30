import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MapWindowResponse, MinimapResponse, VillageOnMap } from '../models/mapModels';
import { environment } from 'src/environments/environment';

export interface AvailableCell {
  x: number;
  y: number;
  hasBoss?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WorldMapService {

  constructor(private http: HttpClient) { }

  getMapWindow(startX: number, startY: number): Observable<MapWindowResponse> {
    return this.http.get<MapWindowResponse>(`${environment.apiUrl}/world/map?startX=${startX}&startY=${startY}`);
  }

  getMinimap(): Observable<MinimapResponse> {
    return this.http.get<MinimapResponse>(`${environment.apiUrl}/world/minimap`);
  }

  getAvailableCells(centerX: number, centerY: number, range: number = 5): Observable<AvailableCell[]> {
    return this.http.get<AvailableCell[]>(
      `${environment.apiUrl}/world/available-cells?centerX=${centerX}&centerY=${centerY}&range=${range}`
    );
  }
}
