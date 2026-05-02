import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsComponent } from '../../admin/reports/reports.component';

@Component({
  selector: 'app-global-reports',
  standalone: true,
  imports: [CommonModule, ReportsComponent],
  template: `<app-reports />`
})
export class GlobalReportsComponent {}
