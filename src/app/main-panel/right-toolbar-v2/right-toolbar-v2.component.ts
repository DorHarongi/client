import { Component, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserInformationService } from 'src/app/user-information/user-information.service';
import { RightToolbarComponent } from '../right-toolbar/right-toolbar.component';

const MAX_COLUMNS = 7;

@Component({
  selector: 'app-right-toolbar-v2',
  templateUrl: '../right-toolbar/right-toolbar.component.html',
  styleUrls: ['./right-toolbar-v2.component.scss']
})
export class RightToolbarV2Component extends RightToolbarComponent implements AfterViewInit, OnDestroy {
  private resizeObserver?: ResizeObserver;
  private rafId = 0;

  constructor(
    userInformationService: UserInformationService,
    http: HttpClient,
    private el: ElementRef
  ) {
    super(userInformationService, http);
  }

  ngAfterViewInit() {
    this.scheduleColumnUpdate();

    const toolbar = this.el.nativeElement.querySelector('.toolbarContainer');
    if (toolbar) {
      this.resizeObserver = new ResizeObserver(() => this.scheduleColumnUpdate());
      this.resizeObserver.observe(toolbar);
    }
  }

  updateVillage() {
    super.updateVillage();
    this.scheduleColumnUpdate();
  }

  private scheduleColumnUpdate() {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.updateColumns());
  }

  private updateColumns() {
    const toolbar = this.el.nativeElement.querySelector('.toolbarContainer');
    if (!toolbar || window.innerWidth <= 1200) return;

    toolbar.removeAttribute('data-columns');
    toolbar.style.overflowY = '';
    void toolbar.offsetHeight;

    if (toolbar.scrollHeight <= toolbar.clientHeight + 1) return;

    for (let cols = 2; cols <= MAX_COLUMNS; cols++) {
      toolbar.setAttribute('data-columns', cols.toString());
      void toolbar.offsetHeight;
      if (toolbar.scrollHeight <= toolbar.clientHeight + 1) return;
    }

    toolbar.style.overflowY = 'auto';
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.rafId);
  }
}
