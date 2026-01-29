export interface VillageOnMap {
    x: number;
    y: number;
    ownerUsername: string;
    villageName: string;
}

export interface MapWindowResponse {
    villages: VillageOnMap[];
    worldSize: number;
}

export interface MinimapResponse {
    villages: VillageOnMap[];
    worldSize: number;
}
