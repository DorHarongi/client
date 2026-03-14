import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface WeatherState {
  isRaining: boolean;
  isSnowing: boolean;
  isRainFading: boolean;
  isSnowFading: boolean;
}

const INITIAL_STATE: WeatherState = {
  isRaining: false,
  isSnowing: false,
  isRainFading: false,
  isSnowFading: false,
};

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private state: WeatherState = { ...INITIAL_STATE };
  private weatherState$ = new BehaviorSubject<WeatherState>({ ...this.state });

  private checkInterval: any;
  private weatherTimeout: any;
  private fadeTimeout: any;
  private started = false;

  readonly rainDrops = Array.from({ length: 150 }, (_, i) => i);
  readonly snowFlakes = Array.from({ length: 200 }, (_, i) => i);

  get state$() {
    return this.weatherState$.asObservable();
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.checkWeather();
    this.checkInterval = setInterval(() => this.checkWeather(), 1000);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    clearInterval(this.checkInterval);
    clearTimeout(this.weatherTimeout);
    clearTimeout(this.fadeTimeout);
    this.state = { ...INITIAL_STATE };
    this.emit();
  }

  private emit(): void {
    this.weatherState$.next({ ...this.state });
  }

  private checkWeather(): void {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    if (seconds > 1) return;
    if (this.state.isRaining || this.state.isSnowing) return;

    if (minutes % 15 === 0) {
      this.startSnow();
    } else if (minutes % 5 === 0) {
      this.startRain();
    }
  }

  private startRain(): void {
    this.state.isRaining = true;
    this.state.isRainFading = false;
    this.emit();

    this.weatherTimeout = setTimeout(() => {
      this.state.isRainFading = true;
      this.emit();
      this.fadeTimeout = setTimeout(() => {
        this.state.isRaining = false;
        this.state.isRainFading = false;
        this.emit();
      }, 2000);
    }, 20000);
  }

  private startSnow(): void {
    this.state.isSnowing = true;
    this.state.isSnowFading = false;
    this.emit();

    this.weatherTimeout = setTimeout(() => {
      this.state.isSnowFading = true;
      this.emit();
      this.fadeTimeout = setTimeout(() => {
        this.state.isSnowing = false;
        this.state.isSnowFading = false;
        this.emit();
      }, 7000);
    }, 20000);
  }

  getRandomLeft(index: number): number {
    return (index * 17 + index * index) % 100;
  }

  getRandomDelay(index: number): number {
    return ((index * 13) % 40) / 10;
  }

  getRandomDuration(index: number, base: number): number {
    return base + ((index * 7) % 20) / 10;
  }

  getRandomSize(index: number): number {
    return 0.5 + ((index * 11) % 10) / 20;
  }
}
