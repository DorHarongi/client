import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../login.service';
import { Subscription } from 'rxjs';
import { ServerService, ServerListItem } from 'src/app/services/server.service';


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

  servers: ServerListItem[] = [];
  serverLoading = true;
  serverError: string | null = null;
  selectedServerId: number | null = null;
  dropdownOpen = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private loginService: LoginService,
        private serverService: ServerService
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

        this.serverService.getServers().subscribe({
          next: (list) => {
            this.servers = list;
            this.serverLoading = false;
            const firstOpen = list.find(s => !s.isClosed && s.status !== 'ended');
            if (firstOpen && this.selectedServerId == null) {
              this.selectServer(firstOpen);
            }
          },
          error: () => {
            this.serverError = 'Could not load server list.';
            this.serverLoading = false;
          }
        });
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

  selectServer(server: ServerListItem): void {
    if (server.isClosed || server.status === 'ended') {
      return;
    }
    this.selectedServerId = server.serverId;
    this.dropdownOpen = false;
  }

  getSelectedServerName(): string {
    const s = this.servers.find(sv => sv.serverId === this.selectedServerId);
    return s ? s.name : '';
  }

    onSubmit() {
        this.submitted = true;
        this.errorMessage = '';

        // stop here if form is invalid
        if (this.registerForm.invalid) {
            return;
        }

        if (this.selectedServerId == null) {
            this.errorMessage = 'Please choose a server for this account.';
            return;
        }

        const selectedServer = this.servers.find(s => s.serverId === this.selectedServerId);
        if (selectedServer?.isClosed || selectedServer?.status === 'ended') {
            this.errorMessage = 'Registration is closed for the selected server. Please choose another server.';
            return;
        }

        this.loading = true;
        // Persist chosen server so X-Server-Id header is correct for registration
        sessionStorage.setItem('serverId', String(this.selectedServerId));

        this.subscription = this.loginService.register(this.form['username'].value, this.form['password'].value)
            .subscribe({
                next: () => {
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.errorMessage = err.error?.message || 'Registration failed';
                }
            });
    }

    goToLogin() {
        this.router.navigate(['login']);
    }
}
