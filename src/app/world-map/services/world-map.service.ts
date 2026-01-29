import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MapWindowResponse, MinimapResponse, VillageOnMap } from '../models/mapModels';
import { environment } from 'src/environments/environment';

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

  getAvailableCells(centerX: number, centerY: number, range: number = 5): Observable<{ x: number; y: number }[]> {
    return this.http.get<{ x: number; y: number }[]>(
      `${environment.apiUrl}/world/available-cells?centerX=${centerX}&centerY=${centerY}&range=${range}`
    );
  }
}
