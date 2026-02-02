import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private router: Router) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = sessionStorage.getItem(TOKEN_KEY);
        
        let req = request;
        if (token) {
            req = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }
        
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                // If 401 Unauthorized, clear token and redirect to login
                if (error.status === 401) {
                    sessionStorage.removeItem(TOKEN_KEY);
                    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
                    this.router.navigate(['/login']);
                }
                return throwError(() => error);
            })
        );
    }
}
