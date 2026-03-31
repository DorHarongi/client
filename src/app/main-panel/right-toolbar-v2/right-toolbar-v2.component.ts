import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { RightToolbarComponent } from '../right-toolbar/right-toolbar.component';

@Component({
  selector: 'app-right-toolbar-v2',
  templateUrl: '../right-toolbar/right-toolbar.component.html',
  styleUrls: ['./right-toolbar-v2.component.scss']
})
export class RightToolbarV2Component extends RightToolbarComponent {
  constructor(
    userInformationService: UserInformationService,
    http: HttpClient
  ) {
    super(userInformationService, http);
  }
}
