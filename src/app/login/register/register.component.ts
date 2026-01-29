import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../login.service';
import { Subscription } from 'rxjs';


@Component({
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
  })
export class RegisterComponent implements OnInit, OnDestroy {
    registerForm!: FormGroup;
    loading = false;
    submitted = false;
    returnUrl!: string;
    subscription!: Subscription;
    errorMessage: string = '';

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private loginService: LoginService
    ) {
        // redirect to home if already logged in
        if (this.loginService.isUserLoggedIn()) {
            this.router.navigate(['home']);
        }
    }
    
    ngOnDestroy(): void {
        if(this.subscription)
            this.subscription.unsubscribe();
    }

    ngOnInit() {
        this.registerForm = this.formBuilder.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validator: this.passwordMatchValidator });

        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');
        
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
        }
        return null;
    }

    // convenience getter for easy access to form fields
    get form() { return this.registerForm.controls; }

    onSubmit() {
        this.submitted = true;
        this.errorMessage = '';

        // stop here if form is invalid
        if (this.registerForm.invalid) {
            return;
        }

        this.loading = true;
        this.loginService.register(this.form['username'].value, this.form['password'].value);
    }

    goToLogin() {
        this.router.navigate(['login']);
    }
}
