import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginService } from './login.service';
import { AuthGuardService } from './auth-guard.service';
import { ServerSelectComponent } from '../server-select/server-select.component';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    ServerSelectComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule
  ],
  providers:[
    LoginService, 
    AuthGuardService
  ]
})
export class LoginModule { }
