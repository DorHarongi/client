import { Injectable } from '@angular/core';
import { ResourcesAmounts } from '../main-panel/models/resourcesAmounts';
import { User } from '../main-panel/models/User';
import { Village } from '../main-panel/models/Village';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

const USER_KEY = 'user_info';

@Injectable({
  providedIn: 'root'
})
export class UserInformationService {
  userInformation!: User;
  currentVillage!: Village;
  currentVillageIndex!: number;
  villageChanged$: Observable<any>;
  private villageChagnedSubject: Subject<void>;
  
  constructor(private http: HttpClient) {
    this.villageChagnedSubject = new Subject<any>();
    this.villageChanged$ = this.villageChagnedSubject.asObservable();
    this.restoreUserFromSession();
   }

  private restoreUserFromSession(): void {
    const userJson = sessionStorage.getItem(USER_KEY);
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.setUserInformation(user);
        // Refresh user data from server
        this.updateUser();
      } catch (e) {
        sessionStorage.removeItem(USER_KEY);
      }
    }
  }

  setUserInformation(user: User)
  {
    this.userInformation = user;
    // Store in session for refresh persistence
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));

    if(!this.currentVillage && !this.currentVillageIndex) // first time when loading the app
    {
      this.currentVillage = this.userInformation?.villages[0];
      this.currentVillageIndex = 0;
    }
    else // after a request to the server like training troops
    {
      this.currentVillage = this.userInformation.villages[this.currentVillageIndex];
      this.villageChagnedSubject.next();
    }
  }

  clearUserInformation(): void {
    sessionStorage.removeItem(USER_KEY);
    // Also clear in-memory user to prevent stale data
    this.userInformation = null as any;
    this.currentVillage = null as any;
    this.currentVillageIndex = 0;
  }

  switchVillage(index: number)
  {
    this.requestVillage(index).subscribe((village: Village)=>{
      this.userInformation.villages[index] = village; // get updated village for updated resources, updated troops in case of attack
      this.currentVillageIndex = index;
      this.currentVillage = this.userInformation.villages[index];
      this.villageChagnedSubject.next();
      // Update stored user
      sessionStorage.setItem(USER_KEY, JSON.stringify(this.userInformation));
    })
  }

  updateUser(): void
  {
    if (!this.userInformation?.username) return;
    this.requestUser().subscribe((user: User)=>{
      this.setUserInformation(user);
    })
  }

  private requestVillage(newVillageIndex: number): Observable<Village>
  {
    return this.http.post<Village>(`${environment.apiUrl}/users/village`,
    {
      username: this.userInformation.username,
      villageIndex: newVillageIndex,
    });
  }

  private requestUser(): Observable<User>
  {
    let username = this.userInformation.username;
    return this.http.get<User>(`${environment.apiUrl}/users/${username}`);
  }

}
