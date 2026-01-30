import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Emit when a message or report is marked as read
  private itemRead$ = new Subject<void>();

  // Observable for components to subscribe to
  onItemRead$ = this.itemRead$.asObservable();

  // Call this when marking an item as read
  notifyItemRead(): void {
    this.itemRead$.next();
  }
}
