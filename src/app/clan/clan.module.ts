import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClanPageComponent } from './clan-page/clan-page.component';
import { ClanChatComponent } from './clan-chat/clan-chat.component';

@NgModule({
  declarations: [
    ClanPageComponent,
    ClanChatComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    ClanPageComponent
  ]
})
export class ClanModule { }
