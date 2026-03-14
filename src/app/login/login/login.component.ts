import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../login.service';
import { Subscription } from 'rxjs';
import { ServerService, ServerListItem } from 'src/app/services/server.service';


@Component({
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
  })
export class LoginComponent implements OnInit, OnDestroy {
    loginForm!: FormGroup;
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
        if (this.previousTheme) {
            document.body.setAttribute('data-theme', this.previousTheme);
        }
        if(this.subscription)
            this.subscription.unsubscribe();
    }

    private previousTheme: string | null = null;

    ngOnInit() {
        this.previousTheme = document.body.getAttribute('data-theme');
        document.body.removeAttribute('data-theme');

        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

        this.serverService.getServers().subscribe({
            next: (list) => {
                this.servers = list;
                this.serverLoading = false;
                if (list.length > 0 && this.selectedServerId == null) {
                    this.selectServer(list[0]);
                }
            },
            error: () => {
                this.serverError = 'Could not load server list.';
                this.serverLoading = false;
            }
        });
    }

    // convenience getter for easy access to form fields
    get form() { return this.loginForm.controls; }

    selectServer(server: ServerListItem): void {
        this.selectedServerId = server.serverId;
        this.dropdownOpen = false;
    }

    getSelectedServerName(): string {
        const s = this.servers.find(sv => sv.serverId === this.selectedServerId);
        return s ? s.name : '';
    }

    async onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }

        if (this.selectedServerId == null) {
            this.errorMessage = 'Please choose a server.';
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        // Persist chosen server so X-Server-Id header is correct
        sessionStorage.setItem('serverId', String(this.selectedServerId));

        this.subscription = this.loginService.login(this.form['username'].value, this.form['password'].value)
            .subscribe({
                next: () => {
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.errorMessage = err.error?.message || 'Login failed';
                }
            });

            
    }
}