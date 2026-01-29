import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, interval, Subscription } from 'rxjs';
import { User } from '../main-panel/models/User';
import { UserInformationService } from '../user-information/user-information.service';
import { environment } from '../../environments/environment';

interface LoginResponse {
  user: User;
  token: string;
  ttlMinutes: number;
}

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const REFRESH_BUFFER_MS = 60000; // Refresh 1 minute before expiry

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  isloggedIn: boolean;
  private refreshSubscription?: Subscription;

  constructor(private http: HttpClient, private userInformationService: UserInformationService, private router: Router) {
    this.isloggedIn = false;
    this.checkExistingSession();
   }

  private checkExistingSession(): void {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (token && expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() < expiryTime) {
        // Token still valid, try to restore session
        this.isloggedIn = true;
        this.startTokenRefresh(expiryTime - Date.now());
        // User info will be restored by UserInformationService
      } else {
        this.clearSession();
        this.userInformationService.clearUserInformation();
      }
    }
  }

  private storeToken(token: string, ttlMinutes: number): void {
    const expiryTime = Date.now() + (ttlMinutes * 60 * 1000);
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    this.startTokenRefresh(ttlMinutes * 60 * 1000);
  }

  private startTokenRefresh(ttlMs: number): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }

    const refreshTime = Math.max(ttlMs - REFRESH_BUFFER_MS, 0);
    
    this.refreshSubscription = interval(refreshTime).subscribe(() => {
      this.refreshToken();
    });
  }

  private refreshToken(): void {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;

    this.http.post<{ token: string; ttlMinutes: number }>(`${environment.apiUrl}/users/refresh-token`, { token })
      .subscribe({
        next: (response) => {
          this.storeToken(response.token, response.ttlMinutes);
        },
        error: () => {
          this.logout();
        }
      });
  }

  private clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  login(username: string, password: string): Observable<LoginResponse>
   {
     let observable: Observable<LoginResponse> = this.http.post<LoginResponse>(`${environment.apiUrl}/users/login`, {
       username: username,
       password: password
     });
      observable.subscribe({
        next: (response: LoginResponse) => {
          this.isloggedIn = true;
          this.storeToken(response.token, response.ttlMinutes);
          this.userInformationService.setUserInformation(response.user);
          this.router.navigate(['home']);
        }
      });
      return observable;
    }

  register(username: string, password: string): void
   {
     this.http.post<LoginResponse>(`${environment.apiUrl}/users/register`, {
       username: username,
       password: password
     }).subscribe({
        next: (response: LoginResponse) => {
          this.isloggedIn = true;
          this.storeToken(response.token, response.ttlMinutes);
          this.userInformationService.setUserInformation(response.user);
          this.router.navigate(['home']);
        },
        error: (err) => {
          console.error('Registration failed:', err);
        }
      });
    }

  logout(): void {
    this.isloggedIn = false;
    this.clearSession();
    this.userInformationService.clearUserInformation();
    this.router.navigate(['login']);
  }

   isUserLoggedIn(): boolean {
    return this.isloggedIn;
  }
}
