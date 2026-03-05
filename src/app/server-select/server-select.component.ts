import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServerService, ServerListItem } from '../services/server.service';

@Component({
  selector: 'app-server-select',
  templateUrl: './server-select.component.html',
  styleUrls: ['./server-select.component.scss']
})
export class ServerSelectComponent implements OnInit {
  servers: ServerListItem[] = [];
  loading = true;
  error: string | null = null;
  selectedServerId: number | null = null;
  joining = false;

  constructor(
    private serverService: ServerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.serverService.getServers().subscribe({
      next: (list) => {
        this.servers = list.length > 0 ? list : [{ serverId: 1, name: 'Server 1', status: 'active' }];
        this.loading = false;
        const stored = sessionStorage.getItem('serverId');
        if (stored) {
          const id = parseInt(stored, 10);
          if (this.servers.some(s => s.serverId === id)) {
            this.selectedServerId = id;
          }
        }
        if (this.selectedServerId == null && this.servers.length > 0) {
          this.selectedServerId = this.servers[0].serverId;
        }
      },
      error: () => {
        this.error = 'Could not load server list.';
        this.loading = false;
      }
    });
  }

  selectServer(server: ServerListItem): void {
    this.selectedServerId = server.serverId;
  }

  enterGame(): void {
    if (this.selectedServerId == null) return;
    this.joining = true;
    sessionStorage.setItem('serverId', String(this.selectedServerId));
    this.serverService.joinServer(this.selectedServerId).subscribe({
      next: () => {
        this.router.navigate(['home']);
      },
      error: () => {
        // Still allow entry (e.g. before multi-server migration)
        this.router.navigate(['home']);
      },
      complete: () => {
        this.joining = false;
      }
    });
  }
}
