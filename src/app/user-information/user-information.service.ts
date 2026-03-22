import { Injectable } from '@angular/core';
import { ResourcesAmounts } from '../main-panel/models/resourcesAmounts';
import { User } from '../main-panel/models/User';
import { Village } from '../main-panel/models/Village';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

const USER_KEY = 'user_info';
const VILLAGE_INDEX_KEY = 'current_village_index';

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
    if (!user) return;

    // Guard against MongoDB ModifyResult wrappers (driver v4.x returns { value, ok })
    if ((user as any).value && !(user as any).username) {
      user = (user as any).value;
      if (!user) return;
    }

    this.userInformation = user;
    const theme = (user as any).theme || 'default';
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-theme', theme);
    }
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));

    if (!this.userInformation?.villages?.length) {
      return;
    }

    if(!this.currentVillage && !this.currentVillageIndex) // first time when loading the app
    {
      const savedIndex = parseInt(sessionStorage.getItem(VILLAGE_INDEX_KEY) || '0', 10);
      const idx = (savedIndex >= 0 && savedIndex < this.userInformation.villages.length) ? savedIndex : 0;
      this.currentVillageIndex = idx;
      this.currentVillage = this.userInformation.villages[idx];
    }
    else // after a request to the server like training troops
    {
      const idx = Math.min(this.currentVillageIndex, this.userInformation.villages.length - 1);
      this.currentVillageIndex = idx;
      this.currentVillage = this.userInformation.villages[idx];
      this.villageChagnedSubject.next();
    }
  }

  notifyVillageChanged(): void {
    this.villageChagnedSubject.next();
  }

  clearUserInformation(): void {
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(VILLAGE_INDEX_KEY);
    this.userInformation = null as any;
    this.currentVillage = null as any;
    this.currentVillageIndex = 0;
    if (typeof document !== 'undefined' && document.body) {
      document.body.removeAttribute('data-theme');
    }
  }

  switchVillage(index: number)
  {
    this.requestVillage(index).subscribe((village: Village)=>{
      this.userInformation.villages[index] = village;
      this.currentVillageIndex = index;
      this.currentVillage = this.userInformation.villages[index];
      this.villageChagnedSubject.next();
      sessionStorage.setItem(USER_KEY, JSON.stringify(this.userInformation));
      sessionStorage.setItem(VILLAGE_INDEX_KEY, String(index));
    })
  }

  updateUser(): void
  {
    if (!this.userInformation?.username) return;
    this.requestUser().subscribe((user: User)=>{
      this.setUserInformation(user);
    })
  }

  // Alias for updateUser - used by components that need explicit refresh
  refreshUserInformation(): void {
    this.updateUser();
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
