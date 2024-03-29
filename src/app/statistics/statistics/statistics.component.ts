import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserInformationService } from 'src/app/user-information/user-information.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit, OnDestroy {

  openAttackPopup: boolean = false;
  userToAttack: string = "";

  constructor(private router: Router, private http: HttpClient, private userInformationService: UserInformationService) {
    this.username = userInformationService.userInformation.username;
   }

  ngOnDestroy(): void {
    if(this.subscription)
      this.subscription.unsubscribe();
  }

  page: number = 1;
  usersInPage: Array<any> = [];
  subscription!: Subscription;
  username: string;

  ngOnInit(): void {
    this.getUserStatistics();
  }

  goBack()
  {
    this.router.navigateByUrl('home');
  }

  moveToPage(page: number)
  {
    this.page = page;
    this.getUserStatistics();
  }

  getUserStatistics()
  {
    this.subscription = this.http.get<any>(`http://localhost:3000/users/statistics/${this.page}`, 
     ).subscribe((users)=>{
        this.usersInPage = users;
    })
  }

  attackPlayer(playerName: string){
    this.userToAttack = playerName; 
    this.openAttackPopup = true;
  }

  attackPopupClosed(){
    this.openAttackPopup = false;
  }

  getEnergy(): number
  {
    return this.userInformationService.userInformation.energy;
  }

}
