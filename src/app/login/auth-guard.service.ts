import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot,RouterStateSnapshot, UrlTree } from '@angular/router';
import { LoginService } from './login.service';
 
 
@Injectable()
export class AuthGuardService implements CanActivate {
 
    constructor(private router:Router, private loginService: LoginService ) {
 
    }
 
    canActivate(route: ActivatedRouteSnapshot,
                state: RouterStateSnapshot): boolean|UrlTree {
 
        // Check both the service state and session storage for token
        const token = this.loginService.getToken();
        if (!this.loginService.isUserLoggedIn() && !token) {            
            this.router.navigate(["login"],{ queryParams: { retUrl: route.url} });
            return false;
        } 
        return true;
    }
 
}
 
