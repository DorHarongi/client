import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClanPageComponent } from './clan-page/clan-page.component';

@NgModule({
  declarations: [
    ClanPageComponent
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
