import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MapWindowResponse, MinimapResponse, VillageOnMap } from '../models/mapModels';

@Injectable({
  providedIn: 'root'
})
export class WorldMapService {

  constructor(private http: HttpClient) { }

  getMapWindow(startX: number, startY: number): Observable<MapWindowResponse> {
    return this.http.get<MapWindowResponse>(`http://localhost:3000/world/map?startX=${startX}&startY=${startY}`);
  }

  getMinimap(): Observable<MinimapResponse> {
    return this.http.get<MinimapResponse>('http://localhost:3000/world/minimap');
  }

  getAvailableCells(centerX: number, centerY: number, range: number = 5): Observable<{ x: number; y: number }[]> {
    return this.http.get<{ x: number; y: number }[]>(
      `http://localhost:3000/world/available-cells?centerX=${centerX}&centerY=${centerY}&range=${range}`
    );
  }
}
