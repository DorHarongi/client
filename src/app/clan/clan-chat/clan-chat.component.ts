import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

interface ChatMessage {
    clanName: string;
    senderUsername: string;
    senderRole: 'leader' | 'member';
    content: string;
    date: string;
}

@Component({
    selector: 'app-clan-chat',
    templateUrl: './clan-chat.component.html',
    styleUrls: ['./clan-chat.component.scss'],
})
export class ClanChatComponent implements OnInit, OnDestroy {
    @Input() clanName!: string;
    @Input() currentUsername!: string;

    messages: ChatMessage[] = [];
    newMessage: string = '';
    sending: boolean = false;

    private socket?: Socket;

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        if (!this.clanName) {
            return;
        }

        // Load history
        this.http
            .get<ChatMessage[]>(`${environment.apiUrl}/chat/${this.clanName}/history`)
            .subscribe((msgs) => {
                this.messages = msgs || [];
            });

        const token = sessionStorage.getItem('auth_token') || '';
        this.socket = io(`${environment.apiUrl}/chat`, {
            auth: { token: `Bearer ${token}` },
        });

        this.socket.on('connect', () => {
            this.socket?.emit('joinClan', { clanName: this.clanName });
        });

        this.socket.on('message', (msg: ChatMessage) => {
            if (msg.clanName !== this.clanName) {
                return;
            }
            this.messages = [...this.messages, msg];
        });
    }

    ngOnDestroy(): void {
        this.socket?.disconnect();
    }

    send(): void {
        if (!this.socket || !this.newMessage.trim()) {
            return;
        }
        this.sending = true;
        const content = this.newMessage.trim();
        this.socket.emit('sendMessage', { clanName: this.clanName, content });
        this.newMessage = '';
        this.sending = false;
    }

    isLeader(msg: ChatMessage): boolean {
        return msg.senderRole === 'leader';
    }
}

