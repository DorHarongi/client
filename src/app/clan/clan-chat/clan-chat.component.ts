import { Component, Input, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
export class ClanChatComponent implements OnInit, OnDestroy, AfterViewChecked {
    @Input() clanName!: string;
    @Input() currentUsername!: string;
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

    messages: ChatMessage[] = [];
    newMessage: string = '';
    sending: boolean = false;
    private shouldScroll: boolean = false;

    private socket?: Socket;

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        if (!this.clanName) {
            return;
        }

        this.http
            .get<ChatMessage[]>(`${environment.apiUrl}/chat/${this.clanName}/history`)
            .subscribe((msgs) => {
                this.messages = msgs || [];
                this.shouldScroll = true;
            });

        const token = sessionStorage.getItem('auth_token') || '';
        const serverId = sessionStorage.getItem('serverId') || '1';
        this.socket = io(`${environment.apiUrl}/chat`, {
            auth: { token: `Bearer ${token}`, serverId },
        });

        this.socket.on('connect', () => {
            this.socket?.emit('joinClan', { clanName: this.clanName });
        });

        this.socket.on('message', (msg: ChatMessage) => {
            if (msg.clanName !== this.clanName) {
                return;
            }
            this.messages = [...this.messages, msg];
            this.shouldScroll = true;
        });
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
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

    private scrollToBottom(): void {
        try {
            const el = this.messagesContainer?.nativeElement;
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        } catch (_) {}
    }
}

